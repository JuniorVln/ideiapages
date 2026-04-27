/**
 * compose-page.ts
 *
 * Transforma um briefing da Fase 0 em uma página piloto no Supabase.
 *
 * Uso:
 *   npx tsx scripts/compose-page.ts --termo-id <uuid> [--publish] [--dry-run]
 *   npx tsx scripts/compose-page.ts --list-pronto
 *
 * Flags:
 *   --termo-id <uuid>    UUID do termo com status briefing_pronto
 *   --publish            Muda status para 'publicado' na hora (default: rascunho)
 *   --dry-run            Apenas imprime o INSERT sem executar
 *   --list-pronto        Lista os termos com briefing_pronto disponíveis
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { buildImagenContextFromBriefing } from "../src/lib/blog/briefing-imagens";
import type { Database } from "../src/lib/database.types";
import { pexelsDiversifyIndex, searchPexelsPhoto } from "../src/lib/pexels";
import {
  briefingJsonToMdx,
  faqJsonbFromBriefing,
  pageMetaFromBriefing,
} from "../src/lib/research/briefing-to-mdx";

// ── Env ───────────────────────────────────────────────────────────────────────
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
  // .env opcional se vars já estiverem no ambiente
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos.");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Ações ─────────────────────────────────────────────────────────────────────

async function listPronto() {
  const { data, error } = await supabase
    .from("termos")
    .select("id, keyword, score_conversao, cluster, intencao")
    .eq("status", "briefing_pronto")
    .order("score_conversao", { ascending: false });

  if (error) {
    console.error("❌  Erro ao listar termos:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("Nenhum termo com status briefing_pronto encontrado.");
    return;
  }

  console.log(`\n📋  Termos com briefing_pronto (${data.length} total):\n`);
  console.log("UUID".padEnd(38), "Score".padEnd(7), "Cluster".padEnd(20), "Keyword");
  console.log("─".repeat(90));
  for (const t of data) {
    const score = (t.score_conversao ?? 0).toFixed(2).padEnd(7);
    const cluster = (t.cluster ?? "—").padEnd(20);
    console.log(t.id.padEnd(38), score, cluster, t.keyword);
  }
  console.log("\n💡  Use: npx tsx scripts/compose-page.ts --termo-id <UUID> [--publish]");
}

async function composePage(termoId: string, publish: boolean, dryRun: boolean) {
  // Busca termo
  const { data: termo, error: termoErr } = await supabase
    .from("termos")
    .select("id, keyword, status, cluster, intencao")
    .eq("id", termoId)
    .single();

  if (termoErr || !termo) {
    console.error(`❌  Termo não encontrado: ${termoId}`);
    process.exit(1);
  }

  if (termo.status !== "briefing_pronto") {
    console.error(`❌  Status do termo é "${termo.status}", esperado "briefing_pronto".`);
    process.exit(1);
  }

  // Busca briefing
  const { data: briefingRow, error: briefingErr } = await supabase
    .from("briefings_seo")
    .select("briefing_jsonb")
    .eq("termo_id", termoId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .single();

  if (briefingErr || !briefingRow) {
    console.error(`❌  Briefing não encontrado para termo ${termoId}`);
    process.exit(1);
  }

  const bj = briefingRow.briefing_jsonb as Record<string, unknown>;
  const meta = pageMetaFromBriefing(bj, termo.keyword);
  const slug = slugify(meta.titulo);
  const titulo = meta.titulo;
  const subtitulo = meta.subtitulo;
  const meta_title = meta.meta_title;
  const meta_description = meta.meta_description;
  const corpo_mdx = briefingJsonToMdx(bj, termo.keyword);
  const faq_jsonb = faqJsonbFromBriefing(bj);
  const cta_whatsapp_texto = meta.cta;
  const status = publish ? "publicado" : "rascunho";
  const publicado_em = publish ? new Date().toISOString() : null;

  const imagensContexto = buildImagenContextFromBriefing(briefingRow.briefing_jsonb, termo.keyword, titulo);
  let og_image_url: string | null = null;
  const heroPhoto = await searchPexelsPhoto({
    query: imagensContexto.hero_query,
    orientation: "landscape",
    resultIndex: pexelsDiversifyIndex(`${slug}:${termo.keyword}:hero`, 12),
  });
  if (heroPhoto?.src) og_image_url = heroPhoto.src;

  const pagina: Database["public"]["Tables"]["paginas"]["Insert"] = {
    termo_id: termoId,
    slug,
    titulo,
    subtitulo,
    corpo_mdx,
    meta_title,
    meta_description,
    faq_jsonb: faq_jsonb as unknown as Database["public"]["Tables"]["paginas"]["Insert"]["faq_jsonb"],
    cta_whatsapp_texto,
    og_image_url,
    imagens_contexto_jsonb: imagensContexto as unknown as Database["public"]["Tables"]["paginas"]["Insert"]["imagens_contexto_jsonb"],
    status,
    publicado_em: publicado_em ?? undefined,
  };

  if (dryRun) {
    console.log("\n📄  DRY RUN — INSERT que seria executado:\n");
    console.log(JSON.stringify(pagina, null, 2));
    console.log(`\n🔗  Slug: /blog/${slug}`);
    return;
  }

  // Verifica se slug já existe
  const { data: existing } = await supabase
    .from("paginas")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️   Página com slug "${slug}" já existe (status: ${existing.status}). Pulando.`);
    console.log(`     ID: ${existing.id}`);
    return;
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("paginas")
    .insert(pagina)
    .select("id, slug, status")
    .single();

  if (insertErr || !inserted) {
    console.error("❌  Erro ao inserir página:", insertErr?.message);
    process.exit(1);
  }

  console.log(`\n✅  Página criada com sucesso!`);
  console.log(`   ID:     ${inserted.id}`);
  console.log(`   Slug:   /blog/${inserted.slug}`);
  console.log(`   Status: ${inserted.status}`);
  if (!publish) {
    console.log(`\n💡  Para publicar: UPDATE paginas SET status='publicado', publicado_em=now() WHERE id='${inserted.id}';`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list-pronto")) {
    await listPronto();
    return;
  }

  const termoIdIdx = args.indexOf("--termo-id");
  if (termoIdIdx === -1 || !args[termoIdIdx + 1]) {
    console.error("Uso: npx tsx scripts/compose-page.ts --termo-id <uuid> [--publish] [--dry-run]");
    console.error("       npx tsx scripts/compose-page.ts --list-pronto");
    process.exit(1);
  }

  const termoId = args[termoIdIdx + 1];
  const publish = args.includes("--publish");
  const dryRun = args.includes("--dry-run");

  await composePage(termoId, publish, dryRun);
}

main().catch((err) => {
  console.error("❌  Erro inesperado:", err);
  process.exit(1);
});
