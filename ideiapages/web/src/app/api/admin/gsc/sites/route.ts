import { getAppBaseUrl } from "@/lib/admin/gsc-app-url";
import { gscPropertyKind, getGscClientForUser, getGscRedirectUri } from "@/lib/admin/google-gsc";
import { getAdminUser } from "@/lib/admin/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Service role Supabase não configurado." }, { status: 503 });
  }
  const base = getAppBaseUrl(req);
  const redirectUri = getGscRedirectUri(base);
  let sc;
  try {
    sc = await getGscClientForUser(user.id, redirectUri);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha GSC";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { data, status } = await sc.sites.list();
  if (status !== 200) {
    return NextResponse.json({ error: "Falha ao listar propriedades Search Console." }, { status: 502 });
  }
  const list = (data.siteEntry ?? [])
    .filter((e) => e.siteUrl)
    .map((e) => ({
      siteUrl: e.siteUrl!,
      permissionLevel: e.permissionLevel ?? null,
      kind: gscPropertyKind(e.siteUrl!),
    }));
  return NextResponse.json({ sites: list });
}
