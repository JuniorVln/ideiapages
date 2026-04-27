import { getAdminUser } from "@/lib/admin/session";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CheckIn = z.object({
  pagina_id: z.string().uuid(),
  termo_id: z.string().uuid().nullable().optional(),
  engine: z.string().min(1).max(120),
  mentioned: z.boolean(),
  checked_at: z.string().optional(),
  detail_jsonb: z.any().nullable().optional(),
});

const BodySchema = z.union([
  z.object({ check: CheckIn }),
  z.object({ checks: z.array(CheckIn).min(1).max(500) }),
]);

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", details: parsed.error.flatten() }, { status: 422 });
  }

  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  }

  const items = "check" in parsed.data ? [parsed.data.check] : parsed.data.checks;
  const paginaIds = [...new Set(items.map((c) => c.pagina_id))];
  const { data: paginas, error: pErr } = await db
    .from("paginas")
    .select("id, termo_id")
    .in("id", paginaIds);
  if (pErr || !paginas || paginas.length !== paginaIds.length) {
    return NextResponse.json(
      { error: "pagina_invalida", message: pErr?.message ?? "Página(ões) não encontrada(s)." },
      { status: 400 },
    );
  }
  const termoByPagina = new Map(paginas.map((p) => [p.id, p.termo_id]));

  const rows = items.map((c) => {
    const fromPage = termoByPagina.get(c.pagina_id) ?? null;
    return {
      pagina_id: c.pagina_id,
      termo_id: c.termo_id !== undefined && c.termo_id !== null ? c.termo_id : fromPage,
      engine: c.engine.trim(),
      mentioned: c.mentioned,
      checked_at: c.checked_at ?? new Date().toISOString(),
      detail_jsonb: c.detail_jsonb ?? null,
    };
  });

  const { data, error } = await db.from("generative_visibility_checks").insert(rows).select("id");

  if (error) {
    console.error("[generative-visibility] insert", error.message);
    return NextResponse.json({ error: "insert_failed", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: (data ?? []).length, ids: (data ?? []).map((d) => d.id) });
}
