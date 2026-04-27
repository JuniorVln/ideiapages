import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  trendBadgeClass,
  trendBadgeLayoutClass,
  trendLabelFromPytrendsJson,
} from "@/lib/research/termo-trend";
import { StatusBadge } from "../research-status";

interface SearchParams {
  status?: string;
  intencao?: string;
  cluster?: string;
  q?: string;
  page?: string;
}

const INTENCOES = ["informacional", "transacional", "comparativa", "navegacional"];
const PAGE_SIZE = 50;

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  let query = db
    .from("termos")
    .select(
      "id, keyword, status, intencao, cluster, score_conversao, volume_estimado, dificuldade, created_at, tendencia_pytrends",
      { count: "exact" },
    )
    .order("score_conversao", { ascending: false, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.intencao) query = query.eq("intencao", sp.intencao);
  if (sp.cluster) query = query.ilike("cluster", `%${sp.cluster}%`);
  if (sp.q) query = query.ilike("keyword", `%${sp.q}%`);

  const { data: termos, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const { data: clusters } = await db
    .from("termos")
    .select("cluster")
    .not("cluster", "is", null)
    .limit(200);
  const uniqueClusters = [...new Set((clusters ?? []).map((r) => r.cluster).filter(Boolean))].sort();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildLink = (extra: Partial<SearchParams>): any => {
    const p = { ...sp, ...extra };
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return `/admin/research/terms${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">
          Palavras-chave{" "}
          <span className="text-slate-400 font-normal text-lg">
            ({count?.toLocaleString("pt-BR") ?? 0})
          </span>
        </h1>
        <Link
          href="/admin/research"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          ← Visão geral
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Busca</label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="keyword..."
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm w-44 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Status</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="briefing_pronto">Roteiro pronto</option>
            <option value="scraped">Scraped</option>
            <option value="snapshot_serp_ok">SERP ok</option>
            <option value="priorizado">Priorizado</option>
            <option value="analisado">Analisado</option>
            <option value="coletado">Coletado</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Intenção</label>
          <select
            name="intencao"
            defaultValue={sp.intencao ?? ""}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Todas</option>
            {INTENCOES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Cluster</label>
          <select
            name="cluster"
            defaultValue={sp.cluster ?? ""}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos</option>
            {uniqueClusters.map((c) => (
              <option key={c} value={c!}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
        >
          Filtrar
        </button>
        {(sp.status || sp.intencao || sp.cluster || sp.q) && (
          <Link
            href="/admin/research/terms"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
          >
            Limpar
          </Link>
        )}
      </form>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left px-4 py-2.5">Keyword</th>
              <th className="text-left px-4 py-2.5 whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-2.5 whitespace-nowrap">Tendência</th>
              <th className="text-left px-4 py-2.5">Intenção</th>
              <th className="text-right px-4 py-2.5">Score</th>
              <th className="text-right px-4 py-2.5">Volume</th>
              <th className="text-right px-4 py-2.5">KD</th>
              <th className="text-left px-4 py-2.5">Cluster</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {(termos ?? []).map((t) => (
              <tr key={t.id} className="hover:bg-slate-900/40">
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/research/terms/${t.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {t.keyword}
                  </Link>
                </td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">
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
                <td className="px-4 py-2 text-right font-mono text-slate-300">
                  {t.score_conversao ?? "—"}
                </td>
                <td className="px-4 py-2 text-right text-slate-400">
                  {t.volume_estimado != null
                    ? Number(t.volume_estimado).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-right text-slate-400">
                  {t.dificuldade ?? "—"}
                </td>
                <td className="px-4 py-2 text-slate-500 max-w-[140px] truncate">
                  {t.cluster ?? "—"}
                </td>
              </tr>
            ))}
            {(termos ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nenhum termo encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end text-sm">
          {page > 1 && (
            <Link
              href={buildLink({ page: String(page - 1) })}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-slate-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildLink({ page: String(page + 1) })}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
