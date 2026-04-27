import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import {
  addDaysYmd,
  collapsePageDay,
  countLeadsByDate,
  dateKeySaoPaulo,
  eachDayInRange,
  formatCompact,
  formatDeltaPct,
  lastWeekBuckets,
  pctDelta,
  sumByDate,
  sumByPagina,
  sumInRange,
  type MetricaRow,
} from "@/lib/admin/dashboard-aggregate";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import { ProviderLeadsChart } from "./ProviderLeadsChart";
import { ProviderWinsDonut, type WinSlice } from "./ProviderWinsDonut";
import { TrafficLeadsChart, type TrafficLeadsRow } from "./TrafficLeadsChart";
import { WeeklyChannelChart, type WeeklyChannelRow } from "./WeeklyChannelChart";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const now = new Date();
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);
  const since60 = new Date(now);
  since60.setDate(since60.getDate() - 60);
  const since30Iso = since30.toISOString();
  const since60Iso = since60.toISOString();

  const todaySp = dateKeySaoPaulo(now);
  const metricasStart = addDaysYmd(todaySp, -89);

  const [
    { count: paginasPub },
    { count: expAtivos },
    { count: leads30cur },
    { count: leads30prev },
    { count: pub30cur },
    { count: pub30prev },
    metricasRows,
    leadsRecent,
    paginasList,
    wonExperiments,
    candidatosTerms,
    expPages,
    recentClosedExps,
  ] = await Promise.all([
    db.from("paginas").select("*", { count: "exact", head: true }).eq("status", "publicado"),
    db.from("experimentos").select("*", { count: "exact", head: true }).eq("status", "ativo"),
    db.from("leads").select("*", { count: "exact", head: true }).gte("criado_em", since30Iso),
    db
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", since60Iso)
      .lt("criado_em", since30Iso),
    db
      .from("paginas")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado")
      .not("publicado_em", "is", null)
      .gte("publicado_em", since30Iso),
    db
      .from("paginas")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado")
      .not("publicado_em", "is", null)
      .gte("publicado_em", since60Iso)
      .lt("publicado_em", since30Iso),
    fetchMetricasRange(db, metricasStart, todaySp),
    fetchLeadsLight(db, since60Iso),
    db
      .from("paginas")
      .select("id, slug, titulo, termo_id, status_experimento, variacao_vencedora_id")
      .eq("status", "publicado"),
    db
      .from("experimentos")
      .select("vencedor_variacao_id")
      .in("status", ["vencedor_declarado", "encerrado"])
      .not("vencedor_variacao_id", "is", null),
    db
      .from("termos")
      .select("id, keyword, score_conversao")
      .eq("status", "briefing_pronto")
      .order("score_conversao", { ascending: false, nullsFirst: false })
      .limit(40),
    db
      .from("paginas")
      .select("id, slug, titulo")
      .eq("status", "publicado")
      .eq("status_experimento", "ativo"),
    db
      .from("experimentos")
      .select("encerrado_em, status, pagina_id, paginas(slug)")
      .in("status", ["vencedor_declarado", "encerrado"])
      .not("encerrado_em", "is", null)
      .order("encerrado_em", { ascending: false })
      .limit(6),
  ]);

  const publishedTermoIds = new Set(
    (paginasList.data ?? []).map((p) => p.termo_id).filter(Boolean) as string[],
  );
  const candidatos =
    (candidatosTerms.data ?? []).filter((t) => !publishedTermoIds.has(t.id)).slice(0, 8) ?? [];

  const metricasNorm: MetricaRow[] = (metricasRows ?? []).map((r) => ({
    pagina_id: r.pagina_id,
    data: r.data,
    variacao_id: r.variacao_id ?? null,
    pageviews: r.pageviews ?? 0,
    leads: r.leads ?? 0,
    cliques_whatsapp: r.cliques_whatsapp ?? 0,
  }));

  const collapsed = collapsePageDay(metricasNorm);
  const byDate = sumByDate(collapsed);

  const startCurSp = addDaysYmd(todaySp, -29);
  const startPrevSp = addDaysYmd(todaySp, -59);
  const endPrevSp = addDaysYmd(todaySp, -30);

  const mCur = sumInRange(byDate, startCurSp, todaySp);
  const mPrev = sumInRange(byDate, startPrevSp, endPrevSp);

  const leadsByDate = countLeadsByDate((leadsRecent ?? []).map((l) => l.criado_em));

  const leadsCur = leads30cur ?? 0;
  const leadsPrev = leads30prev ?? 0;

  const pvDelta = pctDelta(mCur.pageviews, mPrev.pageviews);
  const leadsDelta = pctDelta(leadsCur, leadsPrev);
  const pubDelta = pctDelta(pub30cur ?? 0, pub30prev ?? 0);

  const rateCur = mCur.pageviews > 0 ? leadsCur / mCur.pageviews : 0;
  const ratePrev = mPrev.pageviews > 0 ? leadsPrev / mPrev.pageviews : 0;
  const ratePpDelta =
    mPrev.pageviews > 0 || mCur.pageviews > 0 ? (rateCur - ratePrev) * 100 : null;

  const weekBuckets = lastWeekBuckets(4);
  const weeklyChannel: WeeklyChannelRow[] = weekBuckets.map((w) => {
    let leads = 0;
    let cliquesWhatsapp = 0;
    for (const d of eachDayInRange(w.start, w.end)) {
      leads += leadsByDate.get(d) ?? 0;
      cliquesWhatsapp += byDate.get(d)?.cliques_whatsapp ?? 0;
    }
    return { semana: w.label, leads, cliquesWhatsapp };
  });

  const weekBuckets12 = lastWeekBuckets(12);
  const trafficLeads: TrafficLeadsRow[] = weekBuckets12.map((w) => {
    let visitas = 0;
    let leads = 0;
    for (const d of eachDayInRange(w.start, w.end)) {
      visitas += byDate.get(d)?.pageviews ?? 0;
      leads += leadsByDate.get(d) ?? 0;
    }
    return { label: w.label, visitas, leads };
  });

  const collapsed30 = new Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }>();
  for (const [k, v] of collapsed) {
    const date = k.split("\t")[1]!;
    if (date >= startCurSp && date <= todaySp) collapsed30.set(k, v);
  }
  const byPagina30 = sumByPagina(collapsed30);

  const vencedorIds = [
    ...new Set(
      (paginasList.data ?? []).map((p) => p.variacao_vencedora_id).filter(Boolean) as string[],
    ),
  ];
  const providerByVencedor: Record<string, string> = {};
  if (vencedorIds.length > 0) {
    const { data: varsV } = await db.from("variacoes").select("id, provider").in("id", vencedorIds);
    for (const v of varsV ?? []) {
      providerByVencedor[v.id] = v.provider ?? "desconhecido";
    }
  }

  const leadsByPagina = new Map<string, number>();
  for (const l of leadsRecent ?? []) {
    if (!l.pagina_id) continue;
    const d = dateKeySaoPaulo(new Date(l.criado_em));
    if (d < startCurSp || d > todaySp) continue;
    leadsByPagina.set(l.pagina_id, (leadsByPagina.get(l.pagina_id) ?? 0) + 1);
  }

  const pagesById = new Map((paginasList.data ?? []).map((p) => [p.id, p]));
  type TopRow = {
    slug: string;
    titulo: string;
    pageviews: number;
    leads: number;
    exp: string;
    provider: string | null;
  };
  const topCandidates: TopRow[] = [];
  for (const [pid, m] of byPagina30) {
    const p = pagesById.get(pid);
    if (!p) continue;
    const ld = leadsByPagina.get(pid) ?? m.leads;
    const prov =
      p.variacao_vencedora_id != null
        ? (providerByVencedor[p.variacao_vencedora_id] ?? null)
        : null;
    topCandidates.push({
      slug: p.slug,
      titulo: p.titulo,
      pageviews: m.pageviews,
      leads: ld,
      exp: p.status_experimento,
      provider: prov,
    });
  }
  topCandidates.sort((a, b) => b.leads - a.leads || b.pageviews - a.pageviews);
  const topPages = topCandidates.slice(0, 5);

  const termoIds = [
    ...new Set((paginasList.data ?? []).map((t) => t.termo_id).filter(Boolean) as string[]),
  ];
  let top10Count = 0;
  if (termoIds.length > 0) {
    const { data: snaps } = await db
      .from("serp_snapshots")
      .select("termo_id, posicao, capturado_em")
      .in("termo_id", termoIds)
      .order("capturado_em", { ascending: false })
      .limit(2000);
    const seen = new Set<string>();
    for (const s of snaps ?? []) {
      if (seen.has(s.termo_id)) continue;
      seen.add(s.termo_id);
      if (s.posicao <= 10) top10Count++;
    }
  }

  const variacaoIds = [
    ...new Set(
      (wonExperiments.data ?? []).map((e) => e.vencedor_variacao_id).filter(Boolean) as string[],
    ),
  ];
  const providerByVar: Record<string, string> = {};
  if (variacaoIds.length > 0) {
    const { data: vars } = await db.from("variacoes").select("id, provider").in("id", variacaoIds);
    for (const v of vars ?? []) {
      providerByVar[v.id] = v.provider ?? "desconhecido";
    }
  }
  const winByProv: Record<string, number> = {};
  for (const e of wonExperiments.data ?? []) {
    if (!e.vencedor_variacao_id) continue;
    const pr = providerByVar[e.vencedor_variacao_id] ?? "desconhecido";
    winByProv[pr] = (winByProv[pr] ?? 0) + 1;
  }
  const winSlices: WinSlice[] = Object.entries(winByProv)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const variacaoIds30 = [
    ...new Set((leadsRecent ?? []).map((r) => r.variacao_id).filter(Boolean) as string[]),
  ];
  const providerByVarLead: Record<string, string> = {};
  if (variacaoIds30.length > 0) {
    const { data: vars } = await db.from("variacoes").select("id, provider").in("id", variacaoIds30);
    for (const v of vars ?? []) {
      providerByVarLead[v.id] = v.provider ?? "desconhecido";
    }
  }
  const leadCountByProvider: Record<string, number> = {};
  for (const row of leadsRecent ?? []) {
    const d = dateKeySaoPaulo(new Date(row.criado_em));
    if (d < startCurSp || d > todaySp) continue;
    if (!row.variacao_id) continue;
    const p = providerByVarLead[row.variacao_id] ?? "desconhecido";
    leadCountByProvider[p] = (leadCountByProvider[p] ?? 0) + 1;
  }
  const chartData = Object.entries(leadCountByProvider).map(([provider, total]) => ({
    provider,
    total,
  }));

  const insights = buildInsights({
    candidatos,
    expPages: expPages.data ?? [],
    recentClosed: recentClosedExps.data ?? [],
  });

  const updatedLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(now);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumo de páginas, testes e leads (o atalho &quot;Performance&quot; abre esta tela).
          </p>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm whitespace-nowrap">
          Atualizado: {updatedLabel} · janelas: 30 dias vs 30 dias anteriores
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi
          title="Leads"
          value={leadsCur}
          deltaPct={leadsDelta}
          hint="registros no formulário"
        />
        <Kpi
          title="Taxa de conversão"
          value={`${(rateCur * 100).toFixed(1)}%`}
          deltaPct={null}
          deltaOverride={
            ratePpDelta == null
              ? "—"
              : `${ratePpDelta >= 0 ? "+" : ""}${ratePpDelta.toFixed(1)} p.p. vs período anterior`
          }
          hint="leads ÷ visitas rastreadas"
        />
        <Kpi
          title="Visitas (pageviews)"
          value={formatCompact(mCur.pageviews)}
          deltaPct={pvDelta}
          hint="métricas diárias agregadas"
        />
        <Kpi title="Páginas publicadas" value={paginasPub ?? 0} deltaPct={null} hint="total no ar" />
        <Kpi
          title="Novas publicações"
          value={pub30cur ?? 0}
          deltaPct={pubDelta}
          hint="últimos 30 dias"
        />
        <Kpi
          title="Termos no top 10"
          value={top10Count}
          deltaPct={null}
          hint="SERP mais recente por termo"
        />
        <Kpi title="Experimentos ativos" value={expAtivos ?? 0} deltaPct={null} hint="A/B em andamento" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Tráfego &amp; leads</h2>
          <p className="text-slate-500 text-sm mb-4">Visitas rastreadas vs leads por semana (12 semanas).</p>
          <TrafficLeadsChart data={trafficLeads} />
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Vencedores A/B</h2>
          <p className="text-slate-500 text-sm mb-4">Por provider do braço vencedor (histórico).</p>
          <ProviderWinsDonut data={winSlices} />
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Leads vs cliques WhatsApp</h2>
        <p className="text-slate-500 text-sm mb-4">Últimas 4 semanas (formulário concluído vs CTA WhatsApp).</p>
        <WeeklyChannelChart data={weeklyChannel} />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Leads por provider (30d)</h2>
        {chartData.length === 0 ? (
          <p className="text-slate-500 text-sm">Sem leads com variacao_id nos últimos 30 dias.</p>
        ) : (
          <ProviderLeadsChart data={chartData} />
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold text-white">Top páginas</h2>
            <Link href="/admin/pages" className="text-blue-400 hover:underline text-sm">
              Ver todas
            </Link>
          </div>
          <p className="text-slate-500 text-sm mb-3">Últimos 30 dias · visitas e leads atribuídos.</p>
          {topPages.length === 0 ? (
            <p className="text-slate-500 text-sm">Sem métricas por página no período.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {topPages.map((p) => (
                <li key={p.slug} className="border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
                  <Link href={`/admin/pages/${p.slug}`} className="text-white font-medium hover:text-blue-400">
                    {p.titulo}
                  </Link>
                  <p className="text-slate-500 mt-0.5">
                    {formatCompact(p.pageviews)} vis. · {p.leads} leads · exp: {p.exp}
                    {p.provider && <span className="text-slate-400"> · {p.provider}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold text-white">Alertas &amp; oportunidades</h2>
            <Link href="/admin/recommendations" className="text-blue-400 hover:underline text-sm">
              Ver alertas
            </Link>
          </div>
          {insights.length === 0 ? (
            <p className="text-slate-500 text-sm">Nada novo para destacar.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {insights.map((it) => (
                <li key={it.key} className="flex gap-3">
                  <span className="text-lg shrink-0" aria-hidden>
                    {it.icon}
                  </span>
                  <div>
                    <p className="text-slate-300">{it.text}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{it.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-sm text-slate-500">
        Fonte primária: Supabase (`metricas_diarias`, `leads`, `experimentos`, `serp_snapshots`). Veja também{" "}
        <Link href="/admin/pages" className="text-blue-400 hover:underline">
          todas as páginas
        </Link>{" "}
        e{" "}
        <Link href="/admin/recommendations" className="text-blue-400 hover:underline">
          alertas
        </Link>
        .
      </p>
    </div>
  );
}

type AdminDb = NonNullable<Awaited<ReturnType<typeof getSupabaseAdminOptional>>>;

async function fetchMetricasRange(
  db: AdminDb,
  minDate: string,
  maxDate: string,
): Promise<
  {
    pagina_id: string;
    data: string;
    variacao_id: string | null;
    pageviews: number;
    leads: number;
    cliques_whatsapp: number;
  }[]
> {
  const pageSize = 1000;
  const out: {
    pagina_id: string;
    data: string;
    variacao_id: string | null;
    pageviews: number;
    leads: number;
    cliques_whatsapp: number;
  }[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("metricas_diarias")
      .select("pagina_id, data, variacao_id, pageviews, leads, cliques_whatsapp")
      .gte("data", minDate)
      .lte("data", maxDate)
      .order("data", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("[dashboard] metricas", error.message);
      break;
    }
    if (!data?.length) break;
    out.push(...data);
    if (data.length < pageSize) break;
  }
  return out;
}

async function fetchLeadsLight(
  db: AdminDb,
  sinceIso: string,
): Promise<{ criado_em: string; pagina_id: string | null; variacao_id: string | null }[]> {
  const pageSize = 1000;
  const out: { criado_em: string; pagina_id: string | null; variacao_id: string | null }[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("leads")
      .select("criado_em, pagina_id, variacao_id")
      .gte("criado_em", sinceIso)
      .order("criado_em", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("[dashboard] leads", error.message);
      break;
    }
    if (!data?.length) break;
    out.push(...data);
    if (data.length < pageSize) break;
  }
  return out;
}

function Kpi({
  title,
  value,
  deltaPct,
  deltaOverride,
  hint,
}: {
  title: string;
  value: string | number;
  deltaPct: number | null;
  deltaOverride?: string;
  hint?: string;
}) {
  const deltaText = deltaOverride ?? formatDeltaPct(deltaPct);
  const showDelta =
    (deltaOverride !== undefined && deltaOverride !== null) || deltaPct != null;
  const positive = deltaPct != null && deltaPct > 0;
  const negative = deltaPct != null && deltaPct < 0;
  const overrideNeg = deltaOverride?.trim().startsWith("-");
  const overridePos = deltaOverride?.includes("+");
  const deltaClass =
    deltaOverride !== undefined
      ? overrideNeg
        ? "text-red-400"
        : overridePos
          ? "text-emerald-400"
          : "text-slate-500"
      : positive
        ? "text-emerald-400"
        : negative
          ? "text-red-400"
          : "text-slate-500";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {hint && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
      {showDelta && <p className={`text-xs mt-2 ${deltaClass}`}>{deltaText}</p>}
    </div>
  );
}

function buildInsights({
  candidatos,
  expPages,
  recentClosed,
}: {
  candidatos: { id: string; keyword: string; score_conversao: number | null }[];
  expPages: { id: string; slug: string; titulo: string }[];
  recentClosed: {
    encerrado_em: string | null;
    status: string;
    pagina_id: string;
    paginas: { slug: string } | null;
  }[];
}): { key: string; icon: string; text: string; sub: string }[] {
  const out: { key: string; icon: string; text: string; sub: string }[] = [];

  if (candidatos.length > 0) {
    const sample = candidatos
      .slice(0, 2)
      .map((c) => c.keyword)
      .join(", ");
    out.push({
      key: "cand",
      icon: "◎",
      text: `${candidatos.length} termo(s) com briefing pronto e sem página publicada — ex.: ${sample}.`,
      sub: "Publicar captura demanda enquanto o termo está quente.",
    });
  }

  if (expPages.length > 0) {
    out.push({
      key: "exp",
      icon: "◇",
      text: `${expPages.length} página(s) com experimento A/B ativo.`,
      sub: "Revise amostra e declare vencedor quando estabilizar.",
    });
  }

  for (const ex of recentClosed) {
    if (!ex.encerrado_em) continue;
    const slug = ex.paginas?.slug;
    if (!slug) continue;
    out.push({
      key: `ex-${ex.pagina_id}-${ex.encerrado_em}`,
      icon: "✓",
      text: `Teste na página /${slug} encerrado (${ex.status.replace(/_/g, " ")}).`,
      sub: timeAgoPt(ex.encerrado_em),
    });
    if (out.length >= 6) break;
  }

  return out.slice(0, 6);
}

function timeAgoPt(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}
