/**
 * Gera variações A/B (Claude / GPT / Gemini) a partir de briefing + product_facts.
 *
 * Uso:
 *   pnpm generate-page -- --termo-id <uuid> [--providers claude,gpt,gemini] [--activate] [--replace-llm] [--dry-run]
 *
 * Pré-requisitos: página já criada para o termo (ex.: compose-page). Migration 0012 aplicada.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Database } from "../src/lib/database.types";
import { promptFileForIntencao } from "../src/lib/generation/prompt-path";
import {
  generateForProvider,
  usdEstimateFor,
  type ProviderName,
} from "../src/lib/generation/providers";
import { runQualityGate } from "../src/lib/generation/quality-gate";

const ENV_PATH = resolve(__dirname, "../../.env");
try {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
} catch {
  /* vars no ambiente */
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY obrigatórios.");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const PRODUCT_FACTS_PATH = resolve(__dirname, "../../references/product_facts.md");
const PROMPTS_DIR = resolve(__dirname, "../../references/prompts");

function parseArgs() {
  const argv = process.argv.slice(2);
  let termoId = "";
  let dryRun = false;
  let activate = false;
  let replaceLlm = false;
  let promptVersion = "1";
  let providers: ProviderName[] = ["claude", "gpt", "gemini"];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--termo-id" && argv[i + 1]) {
      termoId = argv[++i]!;
    } else if (a === "--dry-run") dryRun = true;
    else if (a === "--activate") activate = true;
    else if (a === "--replace-llm") replaceLlm = true;
    else if (a === "--prompt-version" && argv[i + 1]) {
      promptVersion = argv[++i]!;
    } else if (a === "--providers" && argv[i + 1]) {
      providers = argv[++i]!.split(",").map((s) => s.trim()) as ProviderName[];
    }
  }

  return { termoId, dryRun, activate, replaceLlm, promptVersion, providers };
}

function buildPrompt(
  template: string,
  keyword: string,
  productFacts: string,
  briefing: unknown,
): string {
  return template
    .replace(/\{\{keyword\}\}/g, keyword)
    .replace(/\{\{product_facts\}\}/g, productFacts)
    .replace(/\{\{briefing_json\}\}/g, JSON.stringify(briefing, null, 2));
}

async function main() {
  const { termoId, dryRun, activate, replaceLlm, promptVersion, providers } = parseArgs();
  if (!termoId) {
    console.error("Uso: pnpm generate-page -- --termo-id <uuid> [opções]");
    process.exit(1);
  }

  const productFacts = readFileSync(PRODUCT_FACTS_PATH, "utf-8");

  const { data: termo, error: tErr } = await supabase
    .from("termos")
    .select("id, keyword, status, intencao")
    .eq("id", termoId)
    .single();

  if (tErr || !termo) {
    console.error("❌  Termo não encontrado.");
    process.exit(1);
  }

  if (termo.status !== "briefing_pronto") {
    console.warn(`⚠️  Status do termo: ${termo.status} (esperado briefing_pronto). Continuando…`);
  }

  const { data: briefingRow, error: bErr } = await supabase
    .from("briefings_seo")
    .select("briefing_jsonb")
    .eq("termo_id", termoId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .single();

  if (bErr || !briefingRow) {
    console.error("❌  Briefing não encontrado.");
    process.exit(1);
  }

  const { data: pagina, error: pErr } = await supabase
    .from("paginas")
    .select("id, slug, titulo, status")
    .eq("termo_id", termoId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pErr || !pagina) {
    console.error("❌  Nenhuma página para este termo. Rode compose-page primeiro.");
    process.exit(1);
  }

  const promptFile = promptFileForIntencao(termo.intencao);
  const template = readFileSync(resolve(PROMPTS_DIR, promptFile), "utf-8");
  const prompt = buildPrompt(template, termo.keyword, productFacts, briefingRow.briefing_jsonb);

  if (replaceLlm && !dryRun) {
    const { error: delErr } = await supabase
      .from("variacoes")
      .delete()
      .eq("pagina_id", pagina.id)
      .neq("provider", "controle");
    if (delErr) console.warn("⚠️  Falha ao remover variações LLM antigas:", delErr.message);
  }

  const results: { provider: ProviderName; ok: boolean; msg?: string }[] = [];

  for (const provider of providers) {
    try {
      if (dryRun) {
        console.log(`[dry-run] Geraria com ${provider}`);
        results.push({ provider, ok: true });
        continue;
      }

      const gen = await generateForProvider(provider, prompt);
      const gate = runQualityGate(gen.page, termo.keyword, productFacts);
      if (!gate.ok) {
        console.error(`❌  ${provider} reprovado no quality-gate:\n   ${gate.reasons.join("\n   ")}`);
        results.push({ provider, ok: false, msg: gate.reasons.join("; ") });
        continue;
      }

      const custo = usdEstimateFor(provider, gen.tokensInput, gen.tokensOutput);
      const nome = `ab-${provider}`;

      const { error: insErr } = await supabase.from("variacoes").insert({
        pagina_id: pagina.id,
        nome,
        corpo_mdx: gen.page.body_mdx,
        ativa: true,
        provider,
        prompt_version: promptVersion,
        model_version: gen.modelVersion,
        tokens_input: gen.tokensInput,
        tokens_output: gen.tokensOutput,
        custo_estimado_usd: custo,
        peso_trafego: 1,
      });

      if (insErr) {
        console.error(`❌  ${provider} insert:`, insErr.message);
        results.push({ provider, ok: false, msg: insErr.message });
        continue;
      }

      console.log(`✅  ${provider} — variação "${nome}" gravada (~$${custo.toFixed(4)} USD est.).`);
      results.push({ provider, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`❌  ${provider}:`, msg);
      results.push({ provider, ok: false, msg });
    }
  }

  if (activate && !dryRun) {
    await supabase
      .from("experimentos")
      .update({
        status: "encerrado",
        encerrado_em: new Date().toISOString(),
      })
      .eq("pagina_id", pagina.id)
      .eq("status", "ativo");

    const { error: exErr } = await supabase.from("experimentos").insert({
      pagina_id: pagina.id,
      status: "ativo",
    });

    if (exErr) {
      console.error("❌  Não foi possível criar experimento ativo:", exErr.message);
    } else {
      const { error: uErr } = await supabase
        .from("paginas")
        .update({ status_experimento: "ativo" })
        .eq("id", pagina.id);
      if (uErr) console.error("❌  Atualizar página:", uErr.message);
      else console.log("🚀  Experimento ativado (status_experimento=ativo).");
    }
  }

  console.log("\nResumo:", results);
  console.log(`🔗  Página: /blog/${pagina.slug} (status: ${pagina.status})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
