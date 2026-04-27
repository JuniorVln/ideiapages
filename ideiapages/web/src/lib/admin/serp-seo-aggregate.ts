/** Contagem de termos cujo domínio do site aparece no top 10 orgânico no snapshot SERP mais recente. */

export function normalizeUrlHost(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    const h = u.hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return "";
  }
}

export function siteHostFromPublicUrl(siteUrl: string): string {
  return normalizeUrlHost(siteUrl);
}

export type SerpRow = {
  termo_id: string;
  posicao: number;
  capturado_em: string;
  url: string;
};

/**
 * Para cada `termo_id`, usa apenas linhas do snapshot com `capturado_em` máximo;
 * conta quantos termos têm pelo menos uma URL cujo host coincide com `siteHostNorm` e posição ≤ 10.
 */
export function countTermsOurDomainInLatestSerpTop10(
  rows: SerpRow[],
  siteHostNorm: string,
): number {
  if (!siteHostNorm) return 0;
  const byTermo = new Map<string, SerpRow[]>();
  for (const r of rows) {
    const g = byTermo.get(r.termo_id) ?? [];
    g.push(r);
    byTermo.set(r.termo_id, g);
  }
  let count = 0;
  for (const [, list] of byTermo) {
    let maxEm = "";
    for (const r of list) {
      if (r.capturado_em > maxEm) maxEm = r.capturado_em;
    }
    if (!maxEm) continue;
    const inLatest = list.filter((r) => r.capturado_em === maxEm);
    const hit = inLatest.some(
      (r) => r.posicao <= 10 && normalizeUrlHost(r.url) === siteHostNorm,
    );
    if (hit) count++;
  }
  return count;
}
