import type { GeneratedPage } from "./schema";

const ANTI_PALAVRAS = [
  /\brevolucion[aá]ri[oa]\b/i,
  /\b[nN]unca visto\b/,
  /\b[mM]ilagre\b/,
  /\b100%\s+garantid[oa]\b/i,
  /\b[uÚ]nico do mercado\b/i,
];

export type QualityGateResult =
  | { ok: true; warnings?: string[] }
  | { ok: false; reasons: string[] };

/**
 * Quality gate determinístico (sem LLM-judge) — Fase 2 MVP.
 */
export function runQualityGate(
  page: GeneratedPage,
  keyword: string,
  productFactsRaw: string,
): QualityGateResult {
  const warnings: string[] = [];
  const reasons: string[] = [];
  const body = page.body_mdx;
  const kw = keyword.trim().toLowerCase();
  
  // Extrai as primeiras ~1500 letras em vez de 800 para dar mais margem
  const head = body.slice(0, 1500).toLowerCase();

  // Keyword validation - softened to warning
  if (kw && !head.includes(kw)) {
    warnings.push(`Keyword principal "${keyword}" não aparece no início do corpo.`);
  }

  const h1Count = (body.match(/^#\s+/gm) ?? []).length;
  if (h1Count > 1) {
    warnings.push("Mais de um H1 (#) no MDX (ajuste feito na renderização se necessário).");
  }

  for (const rx of ANTI_PALAVRAS) {
    if (rx.test(body)) {
      warnings.push(`Anti-padrão de copy: corresponde a ${rx}.`);
    }
  }

  // Softened price check logic:
  const precos = body.match(/R\$\s*[\d]{1,3}(?:\.\d{3})*,\d{2}/g) ?? [];
  const allowedPrecos = productFactsRaw.match(/R\$\s*[\d]{1,3}(?:\.\d{3})*,\d{2}/g) ?? [];
  for (const p of precos) {
    if (!allowedPrecos.includes(p) && !productFactsRaw.includes(p.replace(/\s+/g, ""))) {
      warnings.push(`Possível preço fora de product_facts: ${p}`);
    }
  }

  // Grelha duo: 1.º e 2.º H2 = cards (2 col + 3 col). Contagem de bullets por bloco.
  const h2Blocks = body.split(/(?=^## )/m).filter((b) => /^\s*##\s+/.test(b));
  const listBullets = (s: string) => (s.match(/^\s*[-*]\s+/gm) ?? []).length;
  if (h2Blocks[0]) {
    const n1 = listBullets(h2Blocks[0]);
    if (n1 === 3 || n1 === 5) {
      warnings.push(
        `O primeiro bloco (##) tem ${n1} bullet(s) na lista; a UI usa grelha 2×2. Use 4 ou 6 itens (par) para preencher a grelha sem célula vazia.`,
      );
    }
  }
  if (h2Blocks[1]) {
    const n2 = listBullets(h2Blocks[1]);
    if (n2 > 0 && n2 % 3 !== 0) {
      warnings.push(
        `O segundo bloco (##) tem ${n2} bullet(s); a UI usa 3 colunas. Ideais: 3 ou 6 itens (múltiplos de 3) para alinhar a grelha.`,
      );
    }
  }

  // Se houver um problema gravíssimo que quebra o parser, adicione em 'reasons'
  // Por enquanto, tudo é warning para lubrificar o fluxo e deixar o humano decidir

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, warnings: warnings.length > 0 ? warnings : undefined };
}
