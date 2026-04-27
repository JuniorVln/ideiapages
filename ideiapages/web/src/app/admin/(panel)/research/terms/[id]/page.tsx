import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { briefingPageTitle, briefingTopicosStrings } from "@/lib/research/briefing-json";
import { oportunidadeResumo } from "@/lib/research/termo-oportunidade";
import {
  interesseMedio12mFromPytrendsJson,
  trendBadgeClass,
  trendBadgeLayoutClass,
  trendLabelFromPytrendsJson,
} from "@/lib/research/termo-trend";
import { StatusBadge } from "../../research-status";
import { AtualizarTrendsButton } from "./AtualizarTrendsButton";
import { GerarBriefingButton } from "./GerarBriefingButton";

const allowResearchCli =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_ADMIN_RESEARCH_CLI === "1" ||
  process.env.ALLOW_ADMIN_RESEARCH_CLI === "true";

export default async function TermDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;
  const { id } = await params;

  const { data: termo } = await db.from("termos").select("*").eq("id", id).single();
  if (!termo) notFound();

  const { data: briefings } = await db
    .from("briefings_seo")
    .select("id, briefing_jsonb, criado_em, custo_brl, model, prompt_version, termo_id")
    .eq("termo_id", id)
    .order("criado_em", { ascending: false });

  const { data: serps } = await db
    .from("serp_snapshots")
    .select("id, posicao, titulo, url, meta_description, capturado_em")
    .eq("termo_id", id)
    .order("posicao", { ascending: true })
    .limit(10);

  // concorrentes via snapshot_id dos serps encontrados
  const serpIds = (serps ?? []).map((s) => s.id);
  const { data: concorrentes } = serpIds.length > 0
    ? await db
        .from("conteudo_concorrente")
        .select("id, url, word_count, raspado_em")
        .in("snapshot_id", serpIds)
        .order("raspado_em", { ascending: false })
        .limit(10)
    : { data: [] };

  const { data: pagina } = await db
    .from("paginas")
    .select("id, slug, status, status_experimento")
    .eq("termo_id", id)
    .maybeSingle();

  const hasBriefing = (briefings ?? []).length > 0;
  const op = oportunidadeResumo(termo.score_conversao, termo.volume_estimado);
  const interesseMedio12m = interesseMedio12mFromPytrendsJson(termo.tendencia_pytrends);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/research" className="hover:text-slate-300">
          Visão geral
        </Link>
        <span>/</span>
        <Link href="/admin/research/terms" className="hover:text-slate-300">
          Palavras-chave
        </Link>
        <span>/</span>
        <span className="text-slate-300">{termo.keyword}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{termo.keyword}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <StatusBadge status={termo.status} />
            {termo.intencao && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {termo.intencao}
              </span>
            )}
            {termo.cluster && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                {termo.cluster}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {pagina ? (
            <Link
              href={`/admin/pages/${pagina.slug}`}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium"
            >
              Ver página →
            </Link>
          ) : hasBriefing ? (
            <Link
              href={`/admin/pages/new?briefing_id=${briefings![0].id}`}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
            >
              Criar página
            </Link>
          ) : null}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetaCard label="Score conversão" value={termo.score_conversao ?? "—"} />
        <MetaCard
          label="Volume estimado"
          value={
            termo.volume_estimado != null
              ? Number(termo.volume_estimado).toLocaleString("pt-BR")
              : "—"
          }
        />
        <MetaCard label="KD" value={termo.dificuldade ?? "—"} />
        <MetaCard label="Intenção" value={termo.intencao ?? "—"} />
      </div>

      <p className="text-xs text-slate-500 max-w-3xl -mt-2">
        O <span className="text-slate-400">volume estimado</span> é preenchido ao rodar a coleta Google
        Trends (pytrends): calculamos um <strong className="text-slate-400">proxy de buscas/mês</strong>{" "}
        a partir do índice relativo 0–100 (média dos últimos 12 meses). Não equivale ao volume absoluto
        do Keyword Planner; serve para priorizar termos entre si. Use &quot;Atualizar tendência&quot; abaixo
        se estiver vazio.
        {interesseMedio12m != null && (
          <>
            {" "}
            Índice médio 12m nesta coleta:{" "}
            <span className="text-slate-300 font-mono">
              {interesseMedio12m.toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}
            </span>
            /100.
          </>
        )}
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">Score × volume (oportunidade)</h2>
        <p className="text-xs text-slate-500 mb-3">
          Compara intenção de conversão (score) com demanda de busca (volume). O índice{" "}
          <code className="text-slate-400">score×(1+ln(1+volume))</code> é o mesmo critério de ordenação
          ao promover termos de analisado → priorizado (pipeline / botão Priorizar).
        </p>
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full border font-semibold ${op.badgeClass}`}
            title={op.descricao}
          >
            {op.label}
          </span>
          <div className="text-sm text-slate-300">
            <span className="text-slate-500">Índice:</span>{" "}
            <span className="font-mono text-white">{op.indiceTexto}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{op.descricao}</p>
      </div>

      {/* Tendência (Google Trends) */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Tendência de busca</h2>
        <p className="text-sm text-slate-500 mb-3">
          Sinal relativo (pytrends, geo BR). Atualize quando precisar de dado fresco; o cache na CLI
          evita chamadas em excesso.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className={`text-sm px-3 py-1 rounded-full border ${trendBadgeLayoutClass} ${trendBadgeClass(termo.tendencia_pytrends)}`}
          >
            {trendLabelFromPytrendsJson(termo.tendencia_pytrends)}
          </span>
        </div>
        <AtualizarTrendsButton keyword={termo.keyword} />
      </section>

      {/* Briefing (briefings_seo) */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">
            Briefing ({(briefings ?? []).length})
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {(briefings ?? []).length > 0 && (
              <GerarBriefingButton
                termoId={termo.id}
                allowRemote={allowResearchCli}
                variant="inline"
              />
            )}
            <Link
              href="/admin/research/briefings"
              className="text-xs text-blue-400 hover:underline shrink-0"
            >
              Ver todos →
            </Link>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3 max-w-2xl">
          O roteiro SEO vem do passo <strong className="text-slate-400">analyze-gaps</strong> (Claude).
          Também podes gerar em lote em{" "}
          <Link href="/admin/research#avancado" className="text-blue-400 hover:underline">
            Pesquisa → Avançado → Gaps
          </Link>
          , ou na pasta <code className="text-slate-500">ideiapages/research</code> com a CLI (
          <code className="text-slate-500">analyze-gaps --termo-id …</code> ou{" "}
          <code className="text-slate-500">--all-scraped</code>).
        </p>
        {(briefings ?? []).length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 space-y-4 text-center">
            <p className="text-slate-500 text-sm">Nenhum briefing gerado ainda para este termo.</p>
            <GerarBriefingButton
              termoId={termo.id}
              allowRemote={allowResearchCli}
              variant="block"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {briefings!.map((b) => {
              const bj = (b.briefing_jsonb ?? {}) as Record<string, unknown>;
              const titulo = briefingPageTitle(bj, termo.keyword);
              const metaDesc = (bj.meta_description as string) ?? null;
              const topicos = briefingTopicosStrings(bj);
              const gaps = bj.gaps_identificados ?? bj.gaps ?? null;
              return (
                <div key={b.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <div>
                      <p className="font-medium text-white">{titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Criado em{" "}
                        {b.criado_em ? new Date(b.criado_em).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                    {!pagina && (
                      <Link
                        href={`/admin/pages/new?briefing_id=${b.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium self-start"
                      >
                        Criar página
                      </Link>
                    )}
                  </div>
                  {metaDesc && (
                    <p className="text-sm text-slate-300 leading-relaxed">{metaDesc}</p>
                  )}
                  {topicos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-1">Tópicos sugeridos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topicos.map((t: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {gaps && (
                    <details className="mt-3">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                        Gaps identificados
                      </summary>
                      <pre className="mt-2 text-xs text-slate-400 bg-slate-950 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                        {typeof gaps === "string" ? gaps : JSON.stringify(gaps, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SERP Snapshot */}
      {(serps ?? []).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            SERP Top {serps!.length}
          </h2>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="text-right px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Título</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {serps!.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-2 text-right text-slate-500 font-mono">{s.posicao}</td>
                    <td className="px-4 py-2">
                      <p className="text-slate-200 font-medium leading-tight">{s.titulo ?? s.url}</p>
                      {s.meta_description && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-tight line-clamp-2">
                          {s.meta_description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline truncate block max-w-[200px]"
                      >
                        {s.url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Concorrentes scrapeados */}
      {(concorrentes ?? []).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Concorrentes scrapeados ({concorrentes!.length})
          </h2>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2">URL</th>
                  <th className="text-right px-4 py-2">Words</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">Raspado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
              {concorrentes!.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline truncate block max-w-[300px]"
                        >
                          {c.url}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">
                        {c.word_count?.toLocaleString("pt-BR") ?? "—"}
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell text-slate-500 text-xs">
                        {c.raspado_em ? new Date(c.raspado_em).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* JSON raw (colapsável) */}
      <details className="rounded-xl border border-slate-800 p-4">
        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300">
          Dados brutos do termo
        </summary>
        <pre className="mt-3 text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(termo, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
      <p className="text-xl font-bold text-white">{String(value)}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
