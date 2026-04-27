import { getAdminUser } from "@/lib/admin/session";
import { runGscSync } from "@/lib/monitoring/gsc-sync";
import { runDetectRankingDrop } from "@/lib/monitoring/detect-ranking-drop";
import { processNextAutoRewrite } from "@/lib/monitoring/auto-rewrite-worker";
import { logAutomation } from "@/lib/monitoring/automation-log";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Dispara passos de autocura manualmente (mesma lógica dos crons), autenticado admin.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  const body = (await req.json()) as { step?: string };
  const step = (body.step ?? "all").trim().toLowerCase();

  const gscOauthUserId = process.env.GSC_SYNC_USER_ID?.trim();
  const gscSiteUrl = process.env.GSC_SITE_URL?.trim();
  const daysBack = Math.min(400, Math.max(3, Number(process.env.GSC_SYNC_DAYS_BACK ?? "28") || 28));

  try {
    if (step === "all") {
      if (!gscOauthUserId || !gscSiteUrl) {
        return NextResponse.json(
          { error: "Defina GSC_SYNC_USER_ID e GSC_SITE_URL no ambiente." },
          { status: 503 },
        );
      }
      const gsc = await runGscSync({ db, gscOauthUserId, gscSiteUrl, daysBack });
      await logAutomation(db, "gsc-sync", {
        detalhe: { manual: true, user_id: user.id },
        resultado: { rowsUpserted: gsc.rowsUpserted, errors: gsc.errors },
      });
      const detect = await runDetectRankingDrop(db);
      const rewrite = await processNextAutoRewrite(db);
      return NextResponse.json({ ok: true, gsc, detect, rewrite });
    }

    if (step === "gsc_sync") {
      if (!gscOauthUserId || !gscSiteUrl) {
        return NextResponse.json(
          { error: "Defina GSC_SYNC_USER_ID e GSC_SITE_URL no ambiente." },
          { status: 503 },
        );
      }
      const gsc = await runGscSync({ db, gscOauthUserId, gscSiteUrl, daysBack });
      await logAutomation(db, "gsc-sync", {
        detalhe: { manual: true, user_id: user.id },
        resultado: { rowsUpserted: gsc.rowsUpserted, errors: gsc.errors },
      });
      return NextResponse.json({ ok: true, gsc });
    }

    if (step === "detect") {
      const detect = await runDetectRankingDrop(db);
      return NextResponse.json({ ok: true, detect });
    }

    if (step === "auto_rewrite") {
      const rewrite = await processNextAutoRewrite(db);
      return NextResponse.json({ ok: true, rewrite });
    }

    return NextResponse.json({ error: "step inválido (gsc_sync, detect, auto_rewrite, all)" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
