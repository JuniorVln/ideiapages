import { briefingLsiStrings } from "@/lib/research/briefing-json";

export type PaginaImagensContexto = {
  hero_query: string;
  inline_query: string;
};

function asRecord(bj: unknown): Record<string, unknown> {
  return bj && typeof bj === "object" && !Array.isArray(bj) ? (bj as Record<string, unknown>) : {};
}

/** Extrai um fragmento curto do information_gain para enriquecer busca visual. */
function anguloSnippet(bj: Record<string, unknown>): string {
  const ig = bj.information_gain;
  if (!ig || typeof ig !== "object") return "";
  const a = (ig as { angulo_diferenciado?: unknown }).angulo_diferenciado;
  if (typeof a !== "string") return "";
  const first = a.split(/[.!?]/)[0]?.trim() ?? a.trim();
  return first.slice(0, 100);
}

/**
 * Monta queries Pexels alinhadas ao tema do briefing (keyword + LSI + ângulo).
 * Texto em PT/EN misto funciona na API Pexels.
 */
export function buildImagenContextFromBriefing(
  briefingJsonb: unknown,
  keyword: string,
  titulo: string,
): PaginaImagensContexto {
  const bj = asRecord(briefingJsonb);
  const lsi = briefingLsiStrings(bj);
  const kw = keyword.replace(/\s+/g, " ").trim();
  const t = titulo.replace(/\s+/g, " ").trim();
  const angle = anguloSnippet(bj);

  const lsiHero = lsi.slice(0, 4).join(" ");
  const lsiInline = lsi.slice(2, 8).join(" ");

  const hero_query = [kw, t, lsiHero, "business technology professional"]
    .filter((s) => s.length > 1)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const inline_query = [kw, lsiInline, angle, "team collaboration digital workspace"]
    .filter((s) => s.length > 1)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  return {
    hero_query: hero_query || `${kw} business technology`,
    inline_query:
      inline_query && inline_query !== hero_query
        ? inline_query
        : `${kw} ${lsi.slice(0, 3).join(" ")} office innovation`.replace(/\s+/g, " ").trim().slice(0, 200),
  };
}
