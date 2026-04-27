import { deleteGscLinkForUser } from "@/lib/admin/google-gsc";
import { getAdminUser } from "@/lib/admin/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Service role Supabase não configurado." }, { status: 503 });
  }
  try {
    await deleteGscLinkForUser(user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
