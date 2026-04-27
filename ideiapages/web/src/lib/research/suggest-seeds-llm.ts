import Anthropic from "@anthropic-ai/sdk";
import { extractJsonObject } from "@/lib/generation/parse-json-block";
import { z } from "zod";

const OutSchema = z.object({
  contexto_resumo: z.string().min(10).max(800),
  seeds: z.array(z.string().min(2).max(120)).min(4).max(20),
});

export type SuggestSeedsLlmResult = z.infer<typeof OutSchema>;

const SYSTEM = `És um especialista em SEO e pesquisa de palavras-chave no Brasil. Respondes SEMPRE com um único objeto JSON (sem markdown), com as chaves exatamente: "contexto_resumo" (string em português) e "seeds" (array de strings).`;

export async function suggestSeedsFromContext(params: {
  siteUrl: string;
  pageMarkdown: string;
  gscQueries?: string[];
}): Promise<SuggestSeedsLlmResult> {
  const gscBlock =
    params.gscQueries && params.gscQueries.length > 0
      ? `\n\nConsultas reais do Google (Search Console ou coladas pelo utilizador) — dá prioridade a temas aqui presentes, sem repetir à letra se houver variação melhor:\n${params.gscQueries.map((q) => `- ${q}`).join("\n")}\n`
      : "";

  const user = `URL do site: ${params.siteUrl}
${gscBlock}
Conteúdo principal da página (markdown a partir de Firecrawl):

---
${params.pageMarkdown}
---

Tarefa:
1) Escreve "contexto_resumo": 2 a 3 frases sobre o que o site oferece e a quem se dirige.
2) Gera "seeds": 8 a 15 frases de pesquisa em português (Brasil) que um utilizador real poderia escrever no Google para encontrar estes serviços/produtos. Cada semente: 2 a 8 palavras, específica ao negócio (evita termos vãos como "início" ou o nome de domínio sozinho). Inclui mix de intenções (informativo e transacional). 
3) Não dupliques. Não excedas 20 sementes. JSON apenas.`;

  /** Default: Haiku 4.5 (o 3.5 Haiku 20241022 deixou de existir na API). */
  const model = process.env.CLAUDE_SEED_MODEL ?? "claude-haiku-4-5-20251001";
  const client = new Anthropic();
  const msg = await client.messages.create({
    model,
    max_tokens: 4_096,
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content
    .map((b) => (b.type === "text" ? (b as { text: string }).text : ""))
    .join("");
  let raw: unknown;
  try {
    raw = extractJsonObject(text);
  } catch {
    throw new Error("Resposta do modelo não veio em JSON válido. Tente de novo.");
  }
  const parsed = OutSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Estrutura inesperada do JSON (sementes). Tente de novo.");
  }
  return {
    contexto_resumo: parsed.data.contexto_resumo,
    seeds: parsed.data.seeds.slice(0, 12),
  };
}
