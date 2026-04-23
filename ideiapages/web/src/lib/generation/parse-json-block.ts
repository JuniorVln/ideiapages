/**
 * Extrai o primeiro objeto JSON de uma resposta LLM (markdown ou texto puro).
 */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : trimmed).trim();
  return JSON.parse(raw);
}
