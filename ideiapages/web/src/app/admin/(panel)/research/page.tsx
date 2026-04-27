import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { Suspense } from "react";
import Link from "next/link";
import {
  trendBadgeClass,
  trendBadgeLayoutClass,
  trendLabelFromPytrendsJson,
} from "@/lib/research/termo-trend";
import { ensureMonorepoEnv } from "@/lib/env/ensure-monorepo-env";
import { ResearchAdvancedPanel } from "./ResearchAdvancedPanel";
import { ResearchMainPanel } from "./ResearchMainPanel";
import { StatusBadge } from "./research-status";

ensureMonorepoEnv();

const allowRemote =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_ADMIN_RESEARCH_CLI === "1" ||
  process.env.ALLOW_ADMIN_RESEARCH_CLI === "true";

export const dynamic = "force-dynamic";

export default async function ResearchDashboardPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const { data: termoCounts } = await db.from("termos").select("status");
  const { count: totalBriefings } = await db
    .from("briefings_seo")
    .select("*", { count: "exact", head: true });
  const { count: serpCount } = await db
    .from("serp_snapshots")
    .select("*", { count: "exact", head: true });
  const { count: scrapeCount } = await db
    .from("conteudo_concorrente")
    .select("*", { count: "exact", head: true });
  const { count: paginasPub } = await db
    .from("paginas")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado");

  const total = termoCounts?.length ?? 0;

  const { data: recentTermos } = await db
    .from("termos")
    .select("id, keyword, status, score_conversao, cluster, intencao, created_at, tendencia_pytrends")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: llmCosts } = await db
    .from("llm_calls_log")
    .select("custo_brl, behavior");
  const totalCostBrl = (llmCosts ?? []).reduce((s, r) => s + (r.custo_brl ?? 0), 0);
  const byCost: Record<string, number> = {};
  for (const r of llmCosts ?? []) {
    byCost[r.behavior] = (byCost[r.behavior] ?? 0) + (r.custo_brl ?? 0);
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pesquisa</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total} termos · {totalBriefings ?? 0} roteiros · R$ {totalCostBrl.toFixed(2)} em LLM
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/research/terms"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium"
          >
            Palavras-chave
          </Link>
          <Link
            href="/admin/research/briefings"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Briefing →
          </Link>
        </div>
      </div>

      <Suspense fallback={<p className="text-slate-500 text-sm">A carregar painel…</p>}>
        <ResearchMainPanel allowRemote={allowRemote} />
      </Suspense>

      {/* Métricas de coleta */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Dados coletados
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="SERP Snapshots" value={serpCount ?? 0} />
          <StatCard label="Páginas concorrentes" value={scrapeCount ?? 0} />
          <StatCard label="Roteiros (relatório)" value={totalBriefings ?? 0} />
          <StatCard label="Páginas publicadas" value={paginasPub ?? 0} />
        </div>
      </section>

      {/* Custo por behavior */}
      {Object.keys(byCost).length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Custo LLM por behavior (BRL)
          </h2>
          <div className="flex flex-col gap-2">
            {Object.entries(byCost)
              .sort(([, a], [, b]) => b - a)
              .map(([b, cost]) => (
                <div key={b} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-slate-400 shrink-0 truncate">{b}</div>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, (cost / totalCostBrl) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 w-16 text-right shrink-0">
                    R$ {cost.toFixed(2)}
                  </div>
                </div>
              ))}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-right">
            Total: R$ {totalCostBrl.toFixed(2)}
          </p>
        </section>
      )}

      {/* Termos recentes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Termos recentes
          </h2>
          <Link href="/admin/research/terms" className="text-xs text-blue-400 hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-2">Keyword</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2 whitespace-nowrap">Tendência</th>
                <th className="text-left px-4 py-2">Intenção</th>
                <th className="text-left px-4 py-2">Score</th>
                <th className="text-left px-4 py-2">Cluster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {(recentTermos ?? []).map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/research/terms/${t.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      {t.keyword}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-2 align-middle whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${trendBadgeLayoutClass} ${trendBadgeClass(t.tendencia_pytrends)}`}
                      title="Google Trends (pytrends)"
                    >
                      {trendLabelFromPytrendsJson(t.tendencia_pytrends)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{t.intencao ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-300">{t.score_conversao ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-400 max-w-[120px] truncate">
                    {t.cluster ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details
        id="avancado"
        className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 group"
      >
        <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-200 list-none flex items-center justify-between">
          <span>Passos manuais (manutenção / debug)</span>
          <span className="text-slate-600 group-open:rotate-180 transition">▼</span>
        </summary>
        <div className="mt-4 pt-4 border-t border-slate-800">
          <ResearchAdvancedPanel allowRemote={allowRemote} />
        </div>
      </details>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value.toLocaleString("pt-BR")}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
