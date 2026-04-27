/** Base do badge de tendência: uma linha nas tabelas (“Sem dados”, “Crescente”, etc.). */
export const trendBadgeLayoutClass =
  "inline-flex shrink-0 items-center whitespace-nowrap font-medium";

/** Extrai rótulo amigável de `termos.tendencia_pytrends` (JSON do pipeline pytrends). */
export function trendLabelFromPytrendsJson(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "—";
  const o = raw as Record<string, unknown>;
  const t = o.tendencia;
  if (typeof t !== "string") return "—";
  const map: Record<string, string> = {
    crescente: "Crescente",
    estavel: "Estável",
    decrescente: "Decrescente",
    no_data: "Sem dados",
  };
  return map[t] ?? t;
}

export function trendShort(raw: unknown): string {
  const full = trendLabelFromPytrendsJson(raw);
  if (full === "—" || full === "Sem dados") return full;
  return full.charAt(0);
}

/** Classes Tailwind para badge de tendência (Google Trends / pytrends). */
export function trendBadgeClass(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    return "bg-slate-800 text-slate-500 border-slate-700";
  }
  const o = raw as Record<string, unknown>;
  const t = o.tendencia;
  if (typeof t !== "string") {
    return "bg-slate-800 text-slate-500 border-slate-700";
  }
  if (t === "crescente") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  if (t === "estavel") return "bg-amber-500/15 text-amber-200 border-amber-500/35";
  if (t === "decrescente") return "bg-rose-500/15 text-rose-300 border-rose-500/35";
  if (t === "no_data") return "bg-slate-800 text-slate-500 border-slate-700";
  return "bg-slate-800 text-slate-400 border-slate-700";
}
