/** Data longa estável entre Node (SSR) e browser — evita mismatch de hidratação. */
const TZ_BR = "America/Sao_Paulo";

export function formatDatePtBrLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ_BR,
  });
}
