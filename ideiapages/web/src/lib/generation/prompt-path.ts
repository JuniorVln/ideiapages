/** Mapeia intencao da tabela termos → arquivo em references/prompts/ */

const MAP: Record<string, string> = {
  informacional: "generate-page.informacional.md",
  transacional: "generate-page.transacional.md",
  comparativa: "generate-page.comparativa.md",
  navegacional: "generate-page.navegacional.md",
};

export function promptFileForIntencao(intencao: string | null | undefined): string {
  if (!intencao) return "generate-page.informacional.md";
  return MAP[intencao] ?? "generate-page.informacional.md";
}
