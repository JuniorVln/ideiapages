import { createHmac, timingSafeEqual } from "node:crypto";
import { google } from "googleapis";
import type { searchconsole_v1 } from "googleapis";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const STATE_TTL_MS = 15 * 60 * 1000;

export { GSC_SCOPE };

export function getGscOauthStateSecret(): string {
  const s = process.env.GSC_OAUTH_STATE_SECRET?.trim();
  if (s) return s;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fallback) return `gsc|${fallback}`;
  throw new Error("Defina GSC_OAUTH_STATE_SECRET (recomendado) ou configure Supabase service role.");
}

function getOauthCreds() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const sec = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!id || !sec) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET são necessários para Search Console.");
  }
  return { id, sec };
}

export function getGscRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/gsc/oauth-callback`;
}

export function newOAuth2Client(redirectUri: string) {
  const { id, sec } = getOauthCreds();
  return new google.auth.OAuth2(id, sec, redirectUri);
}

export function signOAuthState(userId: string, secret: string): string {
  const t = Date.now();
  const body = JSON.stringify({ u: userId, t });
  const s = createHmac("sha256", secret).update(body).digest("base64url");
  const packed = JSON.stringify({ u: userId, t, s });
  return Buffer.from(packed, "utf8").toString("base64url");
}

export function verifyOAuthState(
  state: string,
  secret: string,
): { userId: string } | null {
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const j = JSON.parse(raw) as { u?: string; t?: number; s?: string };
    if (!j.u || typeof j.t !== "number" || !j.s) return null;
    if (Date.now() - j.t > STATE_TTL_MS) return null;
    const body = JSON.stringify({ u: j.u, t: j.t });
    const expected = createHmac("sha256", secret).update(body).digest("base64url");
    const a = Buffer.from(j.s);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { userId: j.u };
  } catch {
    return null;
  }
}

export async function saveRefreshTokenForUser(userId: string, refreshToken: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("admin_google_oauth").upsert(
    {
      user_id: userId,
      refresh_token: refreshToken,
      actualizado_em: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function getRefreshTokenForUser(
  userId: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_google_oauth")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.refresh_token?.trim() || null;
}

export async function deleteGscLinkForUser(userId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("admin_google_oauth").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export function getSearchConsole(
  auth: InstanceType<typeof google.auth.OAuth2>,
): searchconsole_v1.Searchconsole {
  return google.searchconsole({ version: "v1", auth });
}

export async function getGscClientForUser(
  userId: string,
  redirectUri: string,
): Promise<searchconsole_v1.Searchconsole> {
  const refresh = await getRefreshTokenForUser(userId);
  if (!refresh) throw new Error("Conta Google não ligada. Use o fluxo OAuth no painel.");
  const o = newOAuth2Client(redirectUri);
  o.setCredentials({ refresh_token: refresh });
  return getSearchConsole(o);
}

/** Prefixo de URL (https://…) ou `sc-domain:exemplo.com`. */
export function gscPropertyKind(
  siteUrl: string,
): "domain" | "url_prefix" {
  return siteUrl.startsWith("sc-domain:") ? "domain" : "url_prefix";
}
