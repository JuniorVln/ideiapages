/**
 * Extrai o primeiro objeto JSON de uma resposta LLM (markdown ou texto puro).
 * Mais resiliente a textos extras ou blocos markdown mal formatados.
 */
export function extractJsonObject(text: string): unknown {
  let content = text.trim();

  // 1. Tenta extrair de blocos de código markdown
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    content = fenceMatch[1].trim();
  }

  // 2. Se ainda não for um JSON puro, procura pelo primeiro '{' e último '}'
  if (!content.startsWith("{")) {
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.slice(firstBrace, lastBrace + 1);
    }
  }

  // 3. Remove possíveis comentários JSON (raro mas acontece com LLMs)
  content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Erro ao fazer parse de JSON extraído:", content);
    throw new Error(`Falha no parse do JSON da IA: ${(err as Error).message}`);
  }
}
