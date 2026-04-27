export const STATUS_ORDER = [
  "briefing_pronto",
  "scraped",
  "snapshot_serp_ok",
  "priorizado",
  "analisado",
  "coletado",
  "descartado",
] as const;

export const STATUS_COLOR: Record<string, string> = {
  briefing_pronto: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  scraped: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  snapshot_serp_ok: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  priorizado: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  analisado: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  coletado: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  descartado: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const STATUS_LABEL: Record<string, string> = {
  briefing_pronto: "Roteiro pronto",
  scraped: "Scraped",
  snapshot_serp_ok: "SERP ok",
  priorizado: "Priorizado",
  analisado: "Analisado",
  coletado: "Coletado",
  descartado: "Descartado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[status] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
