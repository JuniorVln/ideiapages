import { getAdminUser } from "@/lib/admin/session";
import { generatePageVariationsForPagina } from "@/lib/generation/generate-page-variations";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

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

  const { results } = await generatePageVariationsForPagina(db, pagina_id, {
    providers,
    activate,
    replace_existing,
  });

  void slug;
  return NextResponse.json({ ok: true, results });
}
