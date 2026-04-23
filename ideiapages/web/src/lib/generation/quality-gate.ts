import type { GeneratedPage } from "./schema";

const ANTI_PALAVRAS = [
  /\brevolucion[aá]ri[oa]\b/i,
  /\b[nN]unca visto\b/,
  /\b[mM]ilagre\b/,
  /\b100%\s+garantid[oa]\b/i,
  /\b[uÚ]nico do mercado\b/i,
];

export type QualityGateResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

/**
 * Quality gate determinístico (sem LLM-judge) — Fase 2 MVP.
 */
export function runQualityGate(
  page: GeneratedPage,
  keyword: string,
  productFactsRaw: string,
): QualityGateResult {
  const reasons: string[] = [];
  const body = page.body_mdx;
  const kw = keyword.trim().toLowerCase();
  const head = body.slice(0, 800).toLowerCase();

  if (kw && !head.includes(kw)) {
    reasons.push(`Keyword principal "${keyword}" não aparece no início do corpo.`);
  }

  const h1Count = (body.match(/^#\s+/gm) ?? []).length;
  if (h1Count > 1) {
    reasons.push("Mais de um H1 (#) no MDX.");
  }

  for (const rx of ANTI_PALAVRAS) {
    if (rx.test(body)) {
      reasons.push(`Anti-padrão de copy: corresponde a ${rx}.`);
    }
  }

  const precos = body.match(/R\$\s*[\d]{1,3}(?:\.\d{3})*,\d{2}/g) ?? [];
  for (const p of precos) {
    if (!productFactsRaw.includes(p)) {
      reasons.push(`Possível preço fora de product_facts: ${p}`);
    }
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true };
}
