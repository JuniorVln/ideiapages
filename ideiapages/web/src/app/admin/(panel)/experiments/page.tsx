import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  ativo: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  encerrado: "bg-slate-600/40 text-slate-400 border-slate-600",
  vencedor_declarado: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export default async function ExperimentsPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const { data: experiments } = await db
    .from("experimentos")
    .select(
      "id, status, iniciado_em, encerrado_em, p_value, lift, amostra_total, notas, pagina_id, vencedor_variacao_id",
    )
    .order("iniciado_em", { ascending: false })
    .limit(100);

  const paginaIds = [...new Set((experiments ?? []).map((e) => e.pagina_id).filter(Boolean))];
  const { data: paginas } = await db
    .from("paginas")
    .select("id, slug, titulo")
    .in("id", paginaIds);

  const paginaMap: Record<string, { slug: string; titulo: string }> = {};
  for (const p of paginas ?? []) paginaMap[p.id] = p;

  const ativos = (experiments ?? []).filter((e) => e.status === "ativo");
  const outros = (experiments ?? []).filter((e) => e.status !== "ativo");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatório A/B</h1>
          <p className="text-slate-400 text-sm mt-1">
            Experimentos: {ativos.length} ativo{ativos.length !== 1 ? "s" : ""} ·{" "}
            {outros.length} encerrado{outros.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Ativos */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Ativos ({ativos.length})
        </h2>
        {ativos.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 text-center text-slate-500 text-sm">
            Nenhum experimento ativo.{" "}
            <Link href="/admin/pages" className="text-blue-400 hover:underline">
              Gere variações para uma página →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ativos.map((e) => (
              <ExperimentCard key={e.id} exp={e} pagina={paginaMap[e.pagina_id!]} />
            ))}
          </div>
        )}
      </section>

      {/* Histórico */}
      {outros.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Histórico ({outros.length})
          </h2>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2.5">Página</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-right px-4 py-2.5">Amostras</th>
                  <th className="text-right px-4 py-2.5">Lift</th>
                  <th className="text-right px-4 py-2.5">p-value</th>
                  <th className="text-left px-4 py-2.5">Encerrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {outros.map((e) => {
                  const p = paginaMap[e.pagina_id!];
                  return (
                    <tr key={e.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/experiments/${e.id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {p?.titulo ?? p?.slug ?? e.pagina_id?.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono">
                        {e.amostra_total?.toLocaleString("pt-BR") ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono">
                        {e.lift != null ? `${(e.lift * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-slate-500">
                        {e.p_value != null ? e.p_value.toFixed(4) : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs">
                        {e.encerrado_em
                          ? new Date(e.encerrado_em).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ExperimentCard({
  exp,
  pagina,
}: {
  exp: {
    id: string;
    status: string;
    iniciado_em: string | null;
    amostra_total: number | null;
    lift: number | null;
    p_value: number | null;
    notas: string | null;
    pagina_id: string | null;
  };
  pagina?: { slug: string; titulo: string };
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white leading-snug">
            {pagina?.titulo ?? `Experimento ${exp.id.slice(0, 8)}`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Iniciado em{" "}
            {exp.iniciado_em ? new Date(exp.iniciado_em).toLocaleDateString("pt-BR") : "—"}
          </p>
        </div>
        <StatusBadge status={exp.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-800 px-2 py-2">
          <p className="text-lg font-bold text-white">
            {exp.amostra_total?.toLocaleString("pt-BR") ?? "0"}
          </p>
          <p className="text-xs text-slate-500">Amostras</p>
        </div>
        <div className="rounded-lg bg-slate-800 px-2 py-2">
          <p className="text-lg font-bold text-white">
            {exp.lift != null ? `${(exp.lift * 100).toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-slate-500">Lift</p>
        </div>
        <div className="rounded-lg bg-slate-800 px-2 py-2">
          <p
            className={`text-lg font-bold ${
              exp.p_value != null && exp.p_value < 0.05 ? "text-emerald-400" : "text-white"
            }`}
          >
            {exp.p_value != null ? exp.p_value.toFixed(3) : "—"}
          </p>
          <p className="text-xs text-slate-500">p-value</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/admin/experiments/${exp.id}`}
          className="flex-1 text-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
        >
          Ver detalhes
        </Link>
        {pagina && (
          <Link
            href={`/admin/pages/${pagina.slug}`}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
          >
            Página
          </Link>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[status] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
    >
      {status}
    </span>
  );
}
