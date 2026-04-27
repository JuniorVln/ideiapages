import { getAdminUser } from "@/lib/admin/session";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getSupabaseAdminOptional();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { data, error } = await db
    .from("briefings_seo")
    .select("*, termos(keyword, intencao, cluster)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getSupabaseAdminOptional();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 503 });

  const { error } = await db.from("briefings_seo").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
