import { getAppBaseUrl } from "@/lib/admin/gsc-app-url";
import { GSC_SCOPE, newOAuth2Client, signOAuthState, getGscRedirectUri, getGscOauthStateSecret } from "@/lib/admin/google-gsc";
import { getAdminUser } from "@/lib/admin/session";
import { NextRequest, NextResponse } from "next/server";

/**
 * Inicia OAuth Google (Search Console). Redireciona para a página de consentimento.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || !process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()) {
    return NextResponse.json(
      { error: "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET não configurados." },
      { status: 503 },
    );
  }
  const base = getAppBaseUrl(req);
  const redirectUri = getGscRedirectUri(base);
  const oauth2 = newOAuth2Client(redirectUri);
  const state = signOAuthState(user.id, getGscOauthStateSecret());
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GSC_SCOPE],
    state,
    include_granted_scopes: true,
  });
  return NextResponse.redirect(url);
}
