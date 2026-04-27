import { getAppBaseUrl } from "@/lib/admin/gsc-app-url";
import { newOAuth2Client, saveRefreshTokenForUser, verifyOAuthState, getGscRedirectUri, getGscOauthStateSecret } from "@/lib/admin/google-gsc";
import { getAdminUser } from "@/lib/admin/session";
import { NextRequest, NextResponse } from "next/server";

/**
 * Recebe o código Google e grava o refresh token (Supabase) para o utilizador admin autenticado.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login?gsc=session", req.nextUrl.origin));
  }
  const sp = req.nextUrl.searchParams;
  const err = sp.get("error");
  if (err) {
    return NextResponse.redirect(
      new URL(`/admin/research?gsc=denied&reason=${encodeURIComponent(err)}`, req.nextUrl.origin),
    );
  }
  const code = sp.get("code");
  const state = sp.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/admin/research?gsc=error", req.nextUrl.origin));
  }
  const secret = getGscOauthStateSecret();
  const parsed = verifyOAuthState(state, secret);
  if (!parsed || parsed.userId !== user.id) {
    return NextResponse.redirect(new URL("/admin/research?gsc=badstate", req.nextUrl.origin));
  }
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || !process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()) {
    return NextResponse.redirect(new URL("/admin/research?gsc=nocfg", req.nextUrl.origin));
  }
  const base = getAppBaseUrl(req);
  const redirectUri = getGscRedirectUri(base);
  const oauth2 = newOAuth2Client(redirectUri);
  let refresh: string | undefined;
  try {
    const { tokens } = await oauth2.getToken(code);
    refresh = tokens.refresh_token ?? undefined;
  } catch {
    return NextResponse.redirect(new URL("/admin/research?gsc=token", req.nextUrl.origin));
  }
  if (!refresh) {
    return NextResponse.redirect(
      new URL(
        "/admin/research?gsc=norefresh",
        req.nextUrl.origin,
      ),
    );
  }
  try {
    await saveRefreshTokenForUser(user.id, String(refresh));
  } catch {
    return NextResponse.redirect(new URL("/admin/research?gsc=db", req.nextUrl.origin));
  }
  return NextResponse.redirect(new URL("/admin/research?gsc=ok", req.nextUrl.origin));
}
