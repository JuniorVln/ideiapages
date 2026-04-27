import { runDetectRankingDrop } from "@/lib/monitoring/detect-ranking-drop";
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
  const db = getSupabaseAdminOptional();
  if (!db) {
    return jsonError("Supabase não configurado.", 503);
  }
  try {
    const out = await runDetectRankingDrop(db);
    await logAutomation(db, "detect-ranking-drop", {
      resultado: { candidates: out.candidates, skipped_sample: out.skipped.slice(0, 40) },
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
