import { getAdminUser } from "@/lib/admin/session";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { generateWithClaude, generateWithGemini, generateWithGpt, usdEstimateFor } from "@/lib/generation/providers";
import { runQualityGate } from "@/lib/generation/quality-gate";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { NextRequest, NextResponse } from "next/server";

const PROMPTS_DIR = resolve(process.cwd(), "..", "references", "prompts");
const CONTENT_QUALITY_FILE = "content-quality-and-briefing.md";

function loadSharedContentQualityBlock(): string {
  const p = resolve(PROMPTS_DIR, CONTENT_QUALITY_FILE);
  if (existsSync(p)) return "\n\n" + readFileSync(p, "utf-8");
  return "";
}

function loadPrompt(intencao: string | null): string {
  const intent = intencao ?? "informacional";
  const base = PROMPTS_DIR;
  const candidate = resolve(base, `generate-page.${intent}.md`);
  let main: string;
  if (existsSync(candidate)) main = readFileSync(candidate, "utf-8");
  else {
    const fallback = resolve(base, "generate-page.informacional.md");
    if (existsSync(fallback)) main = readFileSync(fallback, "utf-8");
    else
      main = `Gere uma página SEO completa em JSON para o keyword: {{keyword}}\n\nFatos do produto: {{product_facts}}\n\nBriefing: {{briefing_json}}`;
  }
  return main + loadSharedContentQualityBlock();
}

function loadProductFacts(): string {
  const path = resolve(process.cwd(), "..", "references", "product_facts.md");
  if (existsSync(path)) return readFileSync(path, "utf-8");
  return "Produto: Ideia Multichat - plataforma de gestão de WhatsApp para empresas.";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();
  const {
    pagina_id,
    providers = ["claude"],
    activate = false,
    replace_existing = false,
  } = body as {
    pagina_id: string;
    providers: string[];
    activate: boolean;
    replace_existing: boolean;
  };

  if (!pagina_id) return NextResponse.json({ error: "pagina_id obrigatório" }, { status: 400 });

  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase não configurado (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  const { data: pagina } = await db
    .from("paginas")
    .select("id, slug, titulo, termo_id, corpo_mdx")
    .eq("id", pagina_id)
    .single();

  if (!pagina) return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });

  const { data: termo } = await db
    .from("termos")
    .select("keyword, intencao")
    .eq("id", pagina.termo_id!)
    .maybeSingle();

  const { data: briefingRow } = await db
    .from("briefings_seo")
    .select("briefing_jsonb")
    .eq("termo_id", pagina.termo_id!)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const keyword = termo?.keyword ?? pagina.titulo;
  const intencao = termo?.intencao ?? null;

  // Extração simples de GEO (ex: "em São Paulo", "no Rio")
  const geoMatch = keyword.match(/\b(em|no|na|para)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  const geoContext = geoMatch ? `Contexto Geográfico Detectado: ${geoMatch[2]}. ` : "";

  const promptTemplate = loadPrompt(intencao);
  const productFacts = loadProductFacts();
  const briefingForPrompt =
    (briefingRow as { briefing_jsonb?: unknown } | null)?.briefing_jsonb ?? {};
  const briefingJson = JSON.stringify(briefingForPrompt, null, 2);

  const geoBlock =
    geoContext.trim() !== ""
      ? `\n\n### Contexto GEO (deteção a partir da keyword)\n${geoContext}Crie "Information Gain" e exemplos alinhados a esse contexto quando fizer sentido.`
      : "";

  const prompt =
    promptTemplate
      .replace(/\{\{keyword\}\}/g, keyword)
      .replace(/\{\{product_facts\}\}/g, productFacts)
      .replace(/\{\{briefing_json\}\}/g, briefingJson) + geoBlock;

  const results: Array<{
    ok: boolean;
    provider: string;
    model?: string;
    cost?: number;
    error?: string;
  }> = [];

  for (const provider of providers) {
    try {
      if (replace_existing) {
        await db
          .from("variacoes")
          .update({ ativa: false })
          .eq("pagina_id", pagina_id)
          .eq("provider", provider);
      }

      let result;
      if (provider === "claude") result = await generateWithClaude(prompt);
      else if (provider === "gpt") result = await generateWithGpt(prompt);
      else if (provider === "gemini") result = await generateWithGemini(prompt);
      else {
        results.push({ ok: false, provider, error: `Provider desconhecido: ${provider}` });
        continue;
      }

      const qgResult = runQualityGate(result.page, keyword, productFacts);
      const qgErrors = qgResult.ok ? [] : qgResult.reasons;
      const costUsd = usdEstimateFor(
        provider as "claude" | "gpt" | "gemini",
        result.tokensInput,
        result.tokensOutput,
      );

      const nome = `${provider}-v${Date.now()}`;
      const { error: insertErr } = await db.from("variacoes").insert({
        pagina_id: pagina_id,
        nome,
        provider,
        ativa: true,
        corpo_mdx: result.page.body_mdx,
        titulo_alt: result.page.titulo_alt ?? null,
        meta_description_alt: result.page.meta_description_alt ?? null,
        prompt_version: "v1",
        model_version: result.modelVersion,
        tokens_input: result.tokensInput,
        tokens_output: result.tokensOutput,
        custo_estimado_usd: costUsd,
        peso_trafego: 1,
        quality_gate_errors: qgErrors.length > 0 ? qgErrors : null,
      });

      if (insertErr) {
        results.push({ ok: false, provider, error: insertErr.message });
        continue;
      }

      results.push({ ok: true, provider, model: result.modelVersion, cost: costUsd });
    } catch (err) {
      results.push({
        ok: false,
        provider,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Ativar experimento se solicitado e ao menos uma variação gerada com sucesso
  if (activate && results.some((r) => r.ok)) {
    await db
      .from("paginas")
      .update({ status_experimento: "ativo" })
      .eq("id", pagina_id);

    const { data: existingExp } = await db
      .from("experimentos")
      .select("id")
      .eq("pagina_id", pagina_id)
      .eq("status", "ativo")
      .maybeSingle();

    if (!existingExp) {
      await db.from("experimentos").insert({
        pagina_id: pagina_id,
        status: "ativo",
        iniciado_em: new Date().toISOString(),
      });
    }
  }

  void slug;
  return NextResponse.json({ ok: true, results });
}
