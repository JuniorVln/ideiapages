/**
 * Estrutura de `briefings_seo.briefing_jsonb` (pipeline analyze-gaps, Pydantic `BriefingSEO`):
 * título = `title_seo`, metadescription = `meta_description`, tópicos = `topicos_obrigatorios`.
 * Código antigo da UI usava chaves inexistentes (`titulo`, `topicos`).
 */

export function briefingPageTitle(
  bj: Record<string, unknown>,
  keywordFallback?: string | null,
): string {
  for (const k of ["title_seo", "h1_sugerido", "titulo"] as const) {
    const v = bj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const k = typeof keywordFallback === "string" ? keywordFallback.trim() : "";
  if (k) return k;
  return "Sem título";
}

export function briefingTopicosStrings(bj: Record<string, unknown>): string[] {
  const t1 = bj.topicos_obrigatorios;
  if (Array.isArray(t1) && t1.every((x) => typeof x === "string")) {
    return t1 as string[];
  }
  const t2 = bj.topicos;
  if (Array.isArray(t2) && t2.every((x) => typeof x === "string")) {
    return t2 as string[];
  }
  return [];
}

/** LSI / termos semânticos (prompt analyze-gaps v2). */
export function briefingLsiStrings(bj: Record<string, unknown>): string[] {
  const k = bj.keywords_semanticas_lsi;
  if (Array.isArray(k) && k.every((x) => typeof x === "string")) {
    return (k as string[]).filter((s) => s.trim().length > 0);
  }
  return [];
}
