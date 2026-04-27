import { runGscSync } from "@/lib/monitoring/gsc-sync";
import { logAutomation } from "@/lib/monitoring/automation-log";
import { cronAuthErrorResponse, isValidCronRequest } from "@/lib/monitoring/cron-auth";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function jsonError(msg: string, status: number) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

async function handle(req: NextRequest) {
  if (!isValidCronRequest(req)) {
    return cronAuthErrorResponse();
  }

  const gscOauthUserId = process.env.GSC_SYNC_USER_ID?.trim();
  const gscSiteUrl = process.env.GSC_SITE_URL?.trim();
  if (!gscOauthUserId || !gscSiteUrl) {
    return jsonError("Defina GSC_SYNC_USER_ID (UUID do admin com OAuth GSC) e GSC_SITE_URL.", 503);
  }

  const daysBack = Math.min(400, Math.max(3, Number(process.env.GSC_SYNC_DAYS_BACK ?? "28") || 28));

  const db = getSupabaseAdminOptional();
  if (!db) {
    return jsonError("Supabase não configurado.", 503);
  }

  try {
    const out = await runGscSync({
      db,
      gscOauthUserId,
      gscSiteUrl,
      daysBack,
    });
    await logAutomation(db, "gsc-sync", {
      detalhe: { dateStart: out.dateStart, dateEnd: out.dateEnd, pages: out.pages },
      resultado: { rowsUpserted: out.rowsUpserted, errors: out.errors },
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonError(msg, 500);
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
