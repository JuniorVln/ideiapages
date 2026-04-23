/**
 * Homogeneidade de proporções (2 linhas: sucesso / falha, K colunas: braços).
 * Retorna χ² e graus de liberdade (K-1).
 */
export function chiSquareHomogeneity(
  success: number[],
  fail: number[],
): { chiSq: number; df: number } {
  if (success.length !== fail.length || success.length < 2) {
    return { chiSq: 0, df: 0 };
  }
  const k = success.length;
  const colTotals = success.map((s, i) => s + fail[i]!);
  const rowS = success.reduce((a, b) => a + b, 0);
  const rowF = fail.reduce((a, b) => a + b, 0);
  const grand = rowS + rowF;
  if (grand === 0) return { chiSq: 0, df: k - 1 };

  let chiSq = 0;
  for (let j = 0; j < k; j++) {
    const col = colTotals[j]!;
    const expS = (rowS * col) / grand;
    const expF = (rowF * col) / grand;
    const oS = success[j]!;
    const oF = fail[j]!;
    if (expS > 0) chiSq += (oS - expS) ** 2 / expS;
    if (expF > 0) chiSq += (oF - expF) ** 2 / expF;
  }
  return { chiSq, df: k - 1 };
}

/** Valores críticos χ² (α ≈ 0,05) para df 1…6 — aproximação conservadora. */
const CRIT_05: Record<number, number> = {
  1: 3.841,
  2: 5.991,
  3: 7.815,
  4: 9.488,
  5: 11.07,
  6: 12.592,
};

export function isChiSquareSignificant(chiSq: number, df: number): boolean {
  const c = CRIT_05[df];
  if (c == null) return chiSq >= 15; // fallback grosseiro
  return chiSq >= c;
}
