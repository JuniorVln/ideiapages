import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getRefreshTokenForUser } from "@/lib/admin/google-gsc";
import { getAdminUser } from "@/lib/admin/session";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const oauthConfigured = Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() && process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
  );
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      connected: false,
      oauthConfigured,
      supabase: false,
    });
  }
  const refresh = await getRefreshTokenForUser(user.id);
  return NextResponse.json({
    connected: Boolean(refresh),
    oauthConfigured,
    supabase: true,
  });
}
