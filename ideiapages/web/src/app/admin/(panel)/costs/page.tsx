import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";

export default async function AdminCostsPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const { data: vars } = await db
    .from("variacoes")
    .select("provider, custo_estimado_usd")
    .not("custo_estimado_usd", "is", null);

  const byProvider: Record<string, number> = {};
  let sumUsd = 0;
  for (const v of vars ?? []) {
    const c = v.custo_estimado_usd ?? 0;
    sumUsd += c;
    const provKey = v.provider ?? "desconhecido";
    byProvider[provKey] = (byProvider[provKey] ?? 0) + c;
  }

  const { data: llm } = await db.from("llm_calls_log").select("model, custo_brl");

  let sumBrl = 0;
  const byModel: Record<string, number> = {};
  for (const row of llm ?? []) {
    const c = row.custo_brl ?? 0;
    sumBrl += c;
    byModel[row.model] = (byModel[row.model] ?? 0) + c;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Custos</h1>
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Geração de páginas (USD estimado em variações)</h2>
        <p className="text-slate-400 text-sm mb-4">Soma de custo_estimado_usd na tabela variacoes.</p>
        <p className="text-2xl font-bold text-white mb-4">${sumUsd.toFixed(4)}</p>
        <ul className="text-sm text-slate-300 space-y-1">
          {Object.entries(byProvider).map(([k, v]) => (
            <li key={k}>
              {k}: ${v.toFixed(4)}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Pipeline research (BRL em llm_calls_log)</h2>
        <p className="text-2xl font-bold text-white mb-4">
          R$ {sumBrl.toFixed(2)}
        </p>
        <ul className="text-sm text-slate-300 space-y-1">
          {Object.entries(byModel).map(([k, v]) => (
            <li key={k}>
              {k}: R$ {v.toFixed(2)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
