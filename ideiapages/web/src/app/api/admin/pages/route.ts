import { getAdminUser } from "@/lib/admin/session";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { buildImagenContextFromBriefing } from "@/lib/blog/briefing-imagens";
import { pexelsDiversifyIndex, searchPexelsPhoto } from "@/lib/pexels";
import {
  briefingJsonToMdx,
  faqJsonbFromBriefing,
  pageMetaFromBriefing,
} from "@/lib/research/briefing-to-mdx";
import type { Json } from "@/lib/database.types";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { briefing_id, publish } = body as { briefing_id: string; publish?: boolean };

  if (!briefing_id) {
    return NextResponse.json({ error: "briefing_id obrigatório" }, { status: 400 });
  }

  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase não configurado (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  const { data: briefingRow } = await db
    .from("briefings_seo")
    .select("id, briefing_jsonb, termos(id, keyword, status)")
    .eq("id", briefing_id)
    .single();

  if (!briefingRow) {
    return NextResponse.json({ error: "Briefing não encontrado" }, { status: 404 });
  }

  const termo = Array.isArray(briefingRow.termos) ? briefingRow.termos[0] : briefingRow.termos;
  if (!termo) {
    return NextResponse.json({ error: "Termo não encontrado" }, { status: 404 });
  }

  const { data: existing } = await db
    .from("paginas")
    .select("id, slug")
    .eq("termo_id", termo.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Página já existe", slug: existing.slug }, { status: 409 });
  }

  const bj = (briefingRow.briefing_jsonb ?? {}) as Record<string, unknown>;
  const keyword = (termo as { keyword: string }).keyword;
  const meta = pageMetaFromBriefing(bj, keyword);
  const slug = slugify(meta.titulo);
  
  let corpo_mdx = "";
  if (body.refine_with_ai) {
    const { writeFullPageWithAI } = await import("@/lib/generation/page-writer");
    const { loadProductFacts } = await import("@/lib/research/product-facts");
    const productFacts = await loadProductFacts();
    
    try {
      corpo_mdx = await writeFullPageWithAI({
        briefingJson: bj,
        keyword,
        productFacts,
      });
    } catch (e) {
      console.error("AI Generation failed, falling back to basic conversion:", e);
      corpo_mdx = briefingJsonToMdx(bj, keyword);
    }
  } else {
    corpo_mdx = briefingJsonToMdx(bj, keyword);
  }

  const faq = faqJsonbFromBriefing(bj);
  const status = publish ? "publicado" : "rascunho";

  const imagensContexto = buildImagenContextFromBriefing(briefingRow.briefing_jsonb, keyword, meta.titulo);
  let og_image_url: string | null = null;
  const heroPhoto = await searchPexelsPhoto({
    query: imagensContexto.hero_query,
    orientation: "landscape",
    resultIndex: pexelsDiversifyIndex(`${slug}:${keyword}:hero`, 12),
  });
  if (heroPhoto?.src) og_image_url = heroPhoto.src;

  const row: Record<string, unknown> = {
    termo_id: termo.id,
    slug,
    titulo: meta.titulo,
    subtitulo: meta.subtitulo,
    corpo_mdx,
    meta_title: meta.meta_title,
    meta_description: meta.meta_description,
    faq_jsonb: faq ? (faq as unknown as Json) : null,
    cta_whatsapp_texto: meta.cta,
    og_image_url,
    imagens_contexto_jsonb: imagensContexto as unknown as Json,
    status,
    publicado_em: publish ? new Date().toISOString() : undefined,
  };

  let { data: inserted, error } = await db
    .from("paginas")
    .insert(row)
    .select("id, slug, status")
    .single();

  if (error?.message?.includes("imagens_contexto_jsonb")) {
    delete row.imagens_contexto_jsonb;
    ({ data: inserted, error } = await db
      .from("paginas")
      .insert(row)
      .select("id, slug, status")
      .single());
  }

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? "Erro ao criar página" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: inserted.slug, status: inserted.status });
}
