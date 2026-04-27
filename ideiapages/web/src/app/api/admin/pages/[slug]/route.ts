import { getAdminUser } from "@/lib/admin/session";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  const { data: row, error: findErr } = await db
    .from("paginas")
    .select("id")
    .eq("slug", slug)
    .single();

  if (findErr || !row) {
    return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
  }

  // Apaga variações vinculadas antes de apagar a página (FK)
  await db.from("variacoes").delete().eq("pagina_id", row.id);

  const { error: delErr } = await db.from("paginas").delete().eq("id", row.id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

type Body = { status: "publicado" | "rascunho" | "arquivado" };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = (await req.json()) as Body;
  if (!body?.status || !["publicado", "rascunho", "arquivado"].includes(body.status)) {
    return NextResponse.json(
      { error: "body.status deve ser publicado, rascunho ou arquivado" },
      { status: 400 },
    );
  }

  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase não configurado (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  const { data: row, error: findErr } = await db
    .from("paginas")
    .select("id")
    .eq("slug", slug)
    .single();

  if (findErr || !row) {
    return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
  }

  const { error: updErr } = await db
    .from("paginas")
    .update({
      status: body.status,
      publicado_em:
        body.status === "publicado" ? new Date().toISOString() : null,
    })
    .eq("id", row.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: body.status });
}
