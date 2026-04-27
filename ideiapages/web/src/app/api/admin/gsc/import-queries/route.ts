import { getAppBaseUrl } from "@/lib/admin/gsc-app-url";
import { getGscClientForUser, getGscRedirectUri } from "@/lib/admin/google-gsc";
import { getAdminUser } from "@/lib/admin/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Top consultas (dimensão `query`) do Search Analytics, ordenadas por cliques.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Service role Supabase não configurado." }, { status: 503 });
  }
  const body = (await req.json()) as { siteUrl?: string; days?: number; maxQueries?: number };
  const siteUrl = String(body.siteUrl ?? "").trim();
  if (!siteUrl) {
    return NextResponse.json({ error: "siteUrl é obrigatório (propriedade GSC)." }, { status: 400 });
  }
  const days = Math.min(400, Math.max(3, Math.floor(body.days ?? 28)));
  const maxQueries = Math.min(500, Math.max(10, Math.floor(body.maxQueries ?? 100)));

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const endDate = ymd(end);
  const startDate = ymd(start);

  const base = getAppBaseUrl(req);
  const redirectUri = getGscRedirectUri(base);
  let sc;
  try {
    sc = await getGscClientForUser(user.id, redirectUri);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha GSC";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const rows: { query: string; clicks: number; impressions: number; position: number }[] = [];
  let startRow = 0;
  const pageSize = 25000;
  for (;;) {
    const { data, status } = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: pageSize,
        startRow,
        dataState: "all",
        searchType: "web",
      },
    });
    if (status !== 200) {
      return NextResponse.json({ error: "Search Analytics indisponível." }, { status: 502 });
    }
    const chunk = data.rows ?? [];
    for (const r of chunk) {
      const key = r.keys?.[0];
      if (key)
        rows.push({
          query: key,
          clicks: r.clicks ?? 0,
          impressions: r.impressions ?? 0,
          position: r.position ?? 0,
        });
    }
    if (chunk.length < pageSize) break;
    startRow += pageSize;
    if (rows.length >= maxQueries * 2) break;
  }
  rows.sort((a, b) => b.clicks - a.clicks);
  const slice = rows.slice(0, maxQueries);
  return NextResponse.json({
    ok: true,
    queries: slice.map((r) => r.query),
    meta: { startDate, endDate, count: slice.length, siteUrl },
  });
}
