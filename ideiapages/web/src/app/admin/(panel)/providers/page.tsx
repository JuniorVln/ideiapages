import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";

const PROVIDERS = ["claude", "gpt", "gemini"];

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  claude: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" },
  gpt: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  gemini: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
};

export default async function ProvidersPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  // Variações por provider
  const { data: variacoes } = await db
    .from("variacoes")
    .select("id, provider, pagina_id, ativa, custo_estimado_usd, tokens_input, tokens_output, criado_em");

  // Leads por variação
  const varIds = (variacoes ?? []).map((v) => v.id);
  const { data: leads } = await db
    .from("leads")
    .select("variacao_id")
    .in("variacao_id", varIds);

  const leadsByVar: Record<string, number> = {};
  for (const l of leads ?? []) {
    if (l.variacao_id) leadsByVar[l.variacao_id] = (leadsByVar[l.variacao_id] ?? 0) + 1;
  }

  // Métricas de sessão por variação
  const { data: metricas } = await db
    .from("metricas_diarias")
    .select("variacao_id, sessoes, leads")
    .in("variacao_id", varIds);

  const sessoesByVar: Record<string, number> = {};
  for (const m of metricas ?? []) {
    if (m.variacao_id) {
      sessoesByVar[m.variacao_id] = (sessoesByVar[m.variacao_id] ?? 0) + (m.sessoes ?? 0);
    }
  }

  // Agrega por provider
  const stats: Record<
    string,
    {
      variacoes: number;
      ativas: number;
      paginas: Set<string>;
      totalCost: number;
      totalTokensIn: number;
      totalTokensOut: number;
      totalLeads: number;
      totalSessoes: number;
    }
  > = {};

  for (const p of PROVIDERS) {
    stats[p] = {
      variacoes: 0,
      ativas: 0,
      paginas: new Set(),
      totalCost: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalLeads: 0,
      totalSessoes: 0,
    };
  }

  for (const v of variacoes ?? []) {
    const p = v.provider ?? "manual";
    if (!stats[p]) continue;
    stats[p].variacoes++;
    if (v.ativa) stats[p].ativas++;
    if (v.pagina_id) stats[p].paginas.add(v.pagina_id);
    stats[p].totalCost += v.custo_estimado_usd ?? 0;
    stats[p].totalTokensIn += v.tokens_input ?? 0;
    stats[p].totalTokensOut += v.tokens_output ?? 0;
    stats[p].totalLeads += leadsByVar[v.id] ?? 0;
    stats[p].totalSessoes += sessoesByVar[v.id] ?? 0;
  }

  // Experimentos com vencedores por provider
  const { data: exps } = await db
    .from("experimentos")
    .select("vencedor_variacao_id")
    .eq("status", "vencedor_declarado")
    .not("vencedor_variacao_id", "is", null);

  const winnersByProvider: Record<string, number> = {};
  const winnerIds = (exps ?? []).map((e) => e.vencedor_variacao_id!);
  if (winnerIds.length > 0) {
    const { data: winnerVars } = await db
      .from("variacoes")
      .select("id, provider")
      .in("id", winnerIds);
    for (const v of winnerVars ?? []) {
      const p = v.provider ?? "manual";
      winnersByProvider[p] = (winnersByProvider[p] ?? 0) + 1;
    }
  }

  // Melhor provider por taxa de conversão
  const ranked = PROVIDERS        .map((p) => {
    const s = stats[p]!;
    const convRate = s.totalSessoes > 0 ? (s.totalLeads / s.totalSessoes) * 100 : 0;
    const costPerLead = s.totalLeads > 0 ? s.totalCost / s.totalLeads : null;
    return { p, convRate, costPerLead, wins: winnersByProvider[p] ?? 0, variacoes: s.variacoes, paginas: s.paginas, totalCost: s.totalCost, totalLeads: s.totalLeads, totalSessoes: s.totalSessoes };
  }).sort((a, b) => b.convRate - a.convRate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Comparativo de IAs</h1>
        <p className="text-slate-400 text-sm mt-1">
          Performance de Claude, GPT e Gemini nas variações geradas
        </p>
      </div>

      {/* Cards de provider */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ranked.map(({ p, convRate, costPerLead, wins, variacoes: nVar, paginas, totalCost, totalLeads, totalSessoes }) => {
          const c = PROVIDER_COLORS[p] ?? { bg: "bg-slate-700", text: "text-slate-300", border: "border-slate-600" };
          const isFirst = ranked[0]?.p === p;
          return (
            <div
              key={p}
              className={`rounded-xl border ${c.border} ${isFirst ? c.bg : "bg-slate-900/40"} p-5 space-y-4 relative`}
            >
              {isFirst && totalSessoes > 0 && (
                <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium">
                  Melhor taxa
                </span>
              )}
              <div>
                <h2 className={`text-xl font-bold capitalize ${c.text}`}>{p}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {nVar} variação{nVar !== 1 ? "ões" : ""} · {paginas.size} página{paginas.size !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <StatBox
                  label="Taxa conv."
                  value={totalSessoes > 0 ? `${convRate.toFixed(2)}%` : "—"}
                  highlight={isFirst && totalSessoes > 0}
                />
                <StatBox label="Leads totais" value={totalLeads.toLocaleString("pt-BR")} />
                <StatBox label="Sessões" value={totalSessoes.toLocaleString("pt-BR")} />
                <StatBox label="Experimentos ganhos" value={wins.toString()} />
                <StatBox
                  label="Custo total USD"
                  value={totalCost > 0 ? `$${totalCost.toFixed(3)}` : "—"}
                />
                <StatBox
                  label="Custo/lead"
                  value={costPerLead != null ? `$${costPerLead.toFixed(4)}` : "—"}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/admin/pages?provider=${p}`}
                  className="flex-1 text-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Ver páginas
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela detalhada */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Variações recentes</h2>
        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-2.5">Nome</th>
                <th className="text-left px-4 py-2.5">Provider</th>
                <th className="text-left px-4 py-2.5">Página</th>
                <th className="text-right px-4 py-2.5">Leads</th>
                <th className="text-right px-4 py-2.5">Sessões</th>
                <th className="text-right px-4 py-2.5">Custo USD</th>
                <th className="text-left px-4 py-2.5">Criada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {(variacoes ?? [])
                .filter((v) => PROVIDERS.includes(v.provider ?? ""))
                .sort(
                  (a, b) =>
                    new Date(b.criado_em ?? 0).getTime() - new Date(a.criado_em ?? 0).getTime(),
                )
                .slice(0, 30)
                .map((v) => {
                  const c = PROVIDER_COLORS[v.provider ?? ""] ?? {
                    bg: "",
                    text: "text-slate-300",
                    border: "border-slate-600",
                  };
                  return (
                    <tr key={v.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2 font-mono text-xs">{v.id.slice(0, 8)}…</td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.bg} ${c.text} ${c.border}`}
                        >
                          {v.provider ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-400 max-w-[150px] truncate font-mono text-xs">
                        {v.pagina_id?.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2 text-right text-slate-300 font-mono">
                        {leadsByVar[v.id] ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono">
                        {sessoesByVar[v.id]?.toLocaleString("pt-BR") ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-slate-400">
                        {v.custo_estimado_usd != null ? `$${v.custo_estimado_usd.toFixed(4)}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-xs">
                        {v.criado_em ? new Date(v.criado_em).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-800/60 px-2 py-2.5">
      <p className={`text-base font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 leading-tight mt-0.5">{label}</p>
    </div>
  );
}
