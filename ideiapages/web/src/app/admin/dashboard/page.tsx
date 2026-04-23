import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { ProviderLeadsChart } from "./ProviderLeadsChart";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const db = getSupabaseAdmin();

  const { count: paginasPub } = await db
    .from("paginas")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado");

  const { count: expAtivos } = await db
    .from("experimentos")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const { count: leads30 } = await db
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("criado_em", sinceIso);

  const { data: leadsByProvider } = await db
    .from("leads")
    .select("variacao_id")
    .gte("criado_em", sinceIso);

  const variacaoIds = [
    ...new Set((leadsByProvider ?? []).map((r) => r.variacao_id).filter(Boolean)),
  ] as string[];

  const providerByVar: Record<string, string> = {};
  if (variacaoIds.length > 0) {
    const { data: vars } = await db
      .from("variacoes")
      .select("id, provider")
      .in("id", variacaoIds);
    for (const v of vars ?? []) {
      providerByVar[v.id] = v.provider;
    }
  }

  const leadCountByProvider: Record<string, number> = {};
  for (const row of leadsByProvider ?? []) {
    if (!row.variacao_id) continue;
    const p = providerByVar[row.variacao_id] ?? "desconhecido";
    leadCountByProvider[p] = (leadCountByProvider[p] ?? 0) + 1;
  }

  const chartData = Object.entries(leadCountByProvider).map(([provider, total]) => ({
    provider,
    total,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi title="Páginas publicadas" value={paginasPub ?? 0} />
        <Kpi title="Experimentos ativos" value={expAtivos ?? 0} />
        <Kpi title="Leads (30 dias)" value={leads30 ?? 0} />
      </div>
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Leads por provider (30d)</h2>
        {chartData.length === 0 ? (
          <p className="text-slate-500 text-sm">Sem dados com variacao_id nos leads.</p>
        ) : (
          <ProviderLeadsChart data={chartData} />
        )}
      </section>
      <p className="text-sm text-slate-500">
        Fonte primária: Supabase. Veja também{" "}
        <Link href="/admin/pages" className="text-blue-400 hover:underline">
          páginas
        </Link>{" "}
        e{" "}
        <Link href="/admin/recommendations" className="text-blue-400 hover:underline">
          recomendações
        </Link>
        .
      </p>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
