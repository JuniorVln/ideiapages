/**
 * Partes do H1 para destaque visual (marca/keyword) sem alterar o texto completo para SEO.
 */
export function heroTitleParts(
  titulo: string,
  focusKeyword: string | null
): { before: string; highlight: string | null; after: string } {
  if (focusKeyword) {
    const k = focusKeyword.trim();
    if (k.length >= 2) {
      const lower = titulo.toLowerCase();
      const idx = lower.indexOf(k.toLowerCase());
      if (idx >= 0) {
        return {
          before: titulo.slice(0, idx),
          highlight: titulo.slice(idx, idx + k.length),
          after: titulo.slice(idx + k.length),
        };
      }
    }
  }

  const separators = [" — ", " – ", " - "] as const;
  for (const sep of separators) {
    const i = titulo.indexOf(sep);
    if (i > 0 && i < titulo.length - sep.length - 3) {
      return {
        before: titulo.slice(0, i),
        highlight: titulo.slice(i + sep.length),
        after: "",
      };
    }
  }

  const colon = titulo.indexOf(": ");
  if (colon > 0 && colon < 48 && colon < titulo.length - 4) {
    return {
      before: titulo.slice(0, colon),
      highlight: titulo.slice(colon + 2),
      after: "",
    };
  }

  return { before: titulo, highlight: null, after: "" };
}
