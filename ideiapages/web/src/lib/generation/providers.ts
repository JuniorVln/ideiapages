import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { extractJsonObject } from "./parse-json-block";
import { GeneratedPageSchema, type GeneratedPage } from "./schema";

export type ProviderName = "claude" | "gpt" | "gemini";

export type GenerateOk = {
  page: GeneratedPage;
  tokensInput: number;
  tokensOutput: number;
  modelVersion: string;
};

function estimateUsd(provider: ProviderName, input: number, output: number): number {
  // Aproximações para telemetria — ajuste conforme tabela de preços vigente.
  const pin = input / 1_000_000;
  const pout = output / 1_000_000;
  if (provider === "claude") return pin * 3 + pout * 15;
  if (provider === "gpt") return pin * 0.15 + pout * 0.6;
  if (provider === "gemini") return pin * 0.1 + pout * 0.4;
  return 0;
}

export function usdEstimateFor(provider: ProviderName, input: number, output: number): number {
  return Math.round(estimateUsd(provider, input, output) * 1_000_000) / 1_000_000;
}

export async function generateWithClaude(prompt: string): Promise<GenerateOk> {
  const model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514";
  const client = new Anthropic();
  const msg = await client.messages.create({
    model,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content
    .map((b) => (b.type === "text" ? (b as { text: string }).text : ""))
    .join("");
  const json = extractJsonObject(text);
  const page = GeneratedPageSchema.parse(json);
  return {
    page,
    tokensInput: msg.usage?.input_tokens ?? 0,
    tokensOutput: msg.usage?.output_tokens ?? 0,
    modelVersion: model,
  };
}

export async function generateWithGpt(prompt: string): Promise<GenerateOk> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI();
  const r = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const text = r.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(text);
  const page = GeneratedPageSchema.parse(json);
  const usage = r.usage;
  return {
    page,
    tokensInput: usage?.prompt_tokens ?? 0,
    tokensOutput: usage?.completion_tokens ?? 0,
    modelVersion: model,
  };
}

export async function generateWithGemini(prompt: string): Promise<GenerateOk> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY (ou GEMINI_API_KEY) não definido.");
  const gen = new GoogleGenerativeAI(key);
  const m = gen.getGenerativeModel({ model });
  const r = await m.generateContent(
    `${prompt}\n\nResponda com um único objeto JSON válido (sem markdown), chaves: body_mdx, titulo_alt?, meta_description_alt?.`,
  );
  const text = r.response.text();
  const json = extractJsonObject(text);
  const page = GeneratedPageSchema.parse(json);
  const meta = r.response.usageMetadata;
  return {
    page,
    tokensInput: meta?.promptTokenCount ?? 0,
    tokensOutput: meta?.candidatesTokenCount ?? 0,
    modelVersion: model,
  };
}

export async function generateForProvider(
  provider: ProviderName,
  prompt: string,
): Promise<GenerateOk> {
  if (provider === "claude") return generateWithClaude(prompt);
  if (provider === "gpt") return generateWithGpt(prompt);
  return generateWithGemini(prompt);
}
