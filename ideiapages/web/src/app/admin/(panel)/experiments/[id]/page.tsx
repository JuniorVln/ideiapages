import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeclareWinnerButton } from "./DeclareWinnerButton";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;
  const { id } = await params;

  const { data: exp } = await db
    .from("experimentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!exp) notFound();

  const { data: pagina } = await db
    .from("paginas")
    .select("id, slug, titulo, status_experimento")
    .eq("id", exp.pagina_id!)
    .maybeSingle();

  const { data: variacoes } = await db
    .from("variacoes")
    .select("id, nome, provider, ativa, model_version, custo_estimado_usd, peso_trafego")
    .eq("pagina_id", exp.pagina_id!)
    .eq("ativa", true)
    .order("criado_em", { ascending: true });

  // Métricas por variação (últimos 30 dias)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data: metricas } = await db
    .from("metricas_diarias")
    .select("variacao_id, sessoes, pageviews, leads")
    .eq("pagina_id", exp.pagina_id!)
    .gte("data", since.toISOString().split("T")[0]);

  const metricasByVar: Record<string, { sessoes: number; pageviews: number; leads: number }> = {};
  for (const m of metricas ?? []) {
    const vid = m.variacao_id ?? "__none__";
    if (!metricasByVar[vid]) metricasByVar[vid] = { sessoes: 0, pageviews: 0, leads: 0 };
    metricasByVar[vid].sessoes += m.sessoes ?? 0;
    metricasByVar[vid].pageviews += m.pageviews ?? 0;
    metricasByVar[vid].leads += m.leads ?? 0;
  }

  const variacoesWithMetrics = (variacoes ?? []).map((v) => ({
    ...v,
    ...(metricasByVar[v.id] ?? { sessoes: 0, pageviews: 0, leads: 0 }),
    isWinner: v.id === exp.vencedor_variacao_id,
  }));

  const isActive = exp.status === "ativo";

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/experiments" className="hover:text-slate-300">
          Experimentos
        </Link>
        <span>/</span>
        <span className="text-slate-300">{id.slice(0, 8)}…</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {pagina?.titulo ?? `Experimento ${id.slice(0, 8)}`}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
            <span>
              Status:{" "}
              <strong
                className={
                  exp.status === "ativo"
                    ? "text-emerald-400"
                    : exp.status === "vencedor_declarado"
                      ? "text-blue-400"
                      : "text-slate-300"
                }
              >
                {exp.status}
              </strong>
            </span>
            {exp.iniciado_em && (
              <span>
                Início: {new Date(exp.iniciado_em).toLocaleDateString("pt-BR")}
              </span>
            )}
            {exp.encerrado_em && (
              <span>
                Encerramento: {new Date(exp.encerrado_em).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {pagina && (
            <Link
              href={`/admin/pages/${pagina.slug}`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
            >
              Ver página
            </Link>
          )}
          {pagina && (
            <a
              href={`${PUBLIC_CONTENT_BASE_PATH}/${pagina.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
            >
              Abrir site ↗
            </a>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Amostras"
          value={(exp.amostra_total ?? 0).toLocaleString("pt-BR")}
        />
        <KpiCard
          label="Lift"
          value={exp.lift != null ? `${(exp.lift * 100).toFixed(1)}%` : "—"}
        />
        <KpiCard
          label="p-value"
          value={exp.p_value != null ? exp.p_value.toFixed(4) : "—"}
          highlight={exp.p_value != null && exp.p_value < 0.05}
        />
        <KpiCard
          label="Significativo?"
          value={exp.p_value != null ? (exp.p_value < 0.05 ? "Sim ✓" : "Não") : "—"}
          highlight={exp.p_value != null && exp.p_value < 0.05}
        />
      </div>

      {/* Variações */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          Variações ativas ({variacoesWithMetrics.length})
        </h2>
        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-2.5">Nome</th>
                <th className="text-left px-4 py-2.5">Provider</th>
                <th className="text-right px-4 py-2.5">Sessões</th>
                <th className="text-right px-4 py-2.5">Leads</th>
                <th className="text-right px-4 py-2.5">Conv. %</th>
                <th className="text-left px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {variacoesWithMetrics.map((v) => {
                const conv =
                  v.sessoes > 0 ? ((v.leads / v.sessoes) * 100).toFixed(2) : "—";
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-slate-900/40 ${v.isWinner ? "bg-emerald-900/20" : ""}`}
                  >
                    <td className="px-4 py-2 font-mono text-xs">{v.nome}</td>
                    <td className="px-4 py-2">
                      <ProviderBadge provider={v.provider ?? ""} />
                    </td>
                    <td className="px-4 py-2 text-right text-slate-400 font-mono">
                      {v.sessoes.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {v.leads.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      {conv !== "—" ? `${conv}%` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {v.isWinner && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                          Vencedor ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {variacoesWithMetrics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma variação ativa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Declarar vencedor */}
      {isActive && variacoesWithMetrics.length >= 2 && (
        <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">Declarar vencedor</h2>
          <p className="text-sm text-slate-400">
            Analisa estatisticamente as conversões de cada variação e encerra o experimento com o
            melhor resultado. Requer amostras suficientes (mín. 100 por braço).
          </p>
          <DeclareWinnerButton experimentId={id} />
        </section>
      )}

      {/* Notas */}
      {exp.notas && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-2">Notas</h2>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{exp.notas}</p>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
      <p className={`text-2xl font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    claude: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    gpt: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    gemini: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    manual: "bg-slate-600/40 text-slate-300 border-slate-600",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[provider] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
    >
      {provider || "—"}
    </span>
  );
}
