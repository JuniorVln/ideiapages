/** Agregação de `metricas_diarias` evitando duplicar rollup + braços no mesmo dia. */

export type MetricaRow = {
  pagina_id: string;
  data: string;
  variacao_id: string | null;
  pageviews: number;
  leads: number;
  cliques_whatsapp: number;
};

export function collapsePageDay(
  rows: MetricaRow[],
): Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }> {
  const groups = new Map<string, MetricaRow[]>();
  for (const r of rows) {
    const k = `${r.pagina_id}\t${r.data}`;
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  const out = new Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }>();
  for (const [k, group] of groups) {
    const hasRollup = group.some((x) => x.variacao_id == null);
    let pageviews = 0;
    let leads = 0;
    let cliques_whatsapp = 0;
    if (hasRollup) {
      for (const x of group) {
        if (x.variacao_id != null) continue;
        pageviews += x.pageviews;
        leads += x.leads;
        cliques_whatsapp += x.cliques_whatsapp;
      }
    } else {
      for (const x of group) {
        pageviews += x.pageviews;
        leads += x.leads;
        cliques_whatsapp += x.cliques_whatsapp;
      }
    }
    out.set(k, { pageviews, leads, cliques_whatsapp });
  }
  return out;
}

export function sumByDate(collapsed: ReturnType<typeof collapsePageDay>): Map<
  string,
  { pageviews: number; leads: number; cliques_whatsapp: number }
> {
  const byDate = new Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }>();
  for (const [k, v] of collapsed) {
    const date = k.split("\t")[1]!;
    const cur = byDate.get(date) ?? { pageviews: 0, leads: 0, cliques_whatsapp: 0 };
    cur.pageviews += v.pageviews;
    cur.leads += v.leads;
    cur.cliques_whatsapp += v.cliques_whatsapp;
    byDate.set(date, cur);
  }
  return byDate;
}

export function sumByPagina(
  collapsed: ReturnType<typeof collapsePageDay>,
): Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }> {
  const byP = new Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }>();
  for (const [k, v] of collapsed) {
    const paginaId = k.split("\t")[0]!;
    const cur = byP.get(paginaId) ?? { pageviews: 0, leads: 0, cliques_whatsapp: 0 };
    cur.pageviews += v.pageviews;
    cur.leads += v.leads;
    cur.cliques_whatsapp += v.cliques_whatsapp;
    byP.set(paginaId, cur);
  }
  return byP;
}

export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return null;
  }
  return ((current - previous) / previous) * 100;
}

export function formatDeltaPct(delta: number | null): string {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}% vs período anterior`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

/** Data YYYY-MM-DD em America/Sao_Paulo */
export function dateKeySaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, da] = ymd.split("-").map(Number);
  const t = Date.UTC(y!, m! - 1, da!, 12, 0, 0) + days * 86_400_000;
  return dateKeySaoPaulo(new Date(t));
}

/** Últimos `weeks` intervalos de 7 dias (mais recente primeiro). Retorna [startYmd, endYmd] inclusivo SP. */
export function lastWeekBuckets(weeks: number): { label: string; start: string; end: string }[] {
  const today = dateKeySaoPaulo(new Date());
  const buckets: { label: string; start: string; end: string }[] = [];
  for (let w = 0; w < weeks; w++) {
    const endOffset = w * 7;
    const startOffset = endOffset + 6;
    const end = addDaysYmd(today, -endOffset);
    const start = addDaysYmd(today, -startOffset);
    const short = (d: string) => {
      const [, mo, day] = d.split("-");
      return `${day}/${mo}`;
    };
    buckets.push({
      label: `${short(start)}–${short(end)}`,
      start,
      end,
    });
  }
  return buckets.reverse();
}

export function sumInRange(
  byDate: Map<string, { pageviews: number; leads: number; cliques_whatsapp: number }>,
  start: string,
  end: string,
): { pageviews: number; leads: number; cliques_whatsapp: number } {
  let pageviews = 0;
  let leads = 0;
  let cliques_whatsapp = 0;
  for (const [date, v] of byDate) {
    if (date >= start && date <= end) {
      pageviews += v.pageviews;
      leads += v.leads;
      cliques_whatsapp += v.cliques_whatsapp;
    }
  }
  return { pageviews, leads, cliques_whatsapp };
}

export function countLeadsByDate(leadsCriadoEm: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const iso of leadsCriadoEm) {
    const k = dateKeySaoPaulo(new Date(iso));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function eachDayInRange(start: string, end: string): string[] {
  const out: string[] = [];
  let d = start;
  while (d <= end) {
    out.push(d);
    d = addDaysYmd(d, 1);
  }
  return out;
}
