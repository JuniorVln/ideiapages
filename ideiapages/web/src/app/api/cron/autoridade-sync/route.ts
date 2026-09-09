import { dominiosMonitorados, runAutoridadeSync } from "@/lib/monitoring/autoridade-sync";
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

  const apiKey = process.env.OPENPAGERANK_API_KEY?.trim();
  if (!apiKey) {
    return jsonError("Defina OPENPAGERANK_API_KEY (chave em openpagerank.keywordseverywhere.com).", 503);
  }

  const dominios = dominiosMonitorados();
  if (dominios.length === 0) {
    return jsonError("Defina AUTORIDADE_DOMINIOS ou NEXT_PUBLIC_SITE_URL.", 503);
  }

  const db = getSupabaseAdminOptional();
  if (!db) {
    return jsonError("Supabase não configurado.", 503);
  }

  try {
    const out = await runAutoridadeSync({ db, apiKey, dominios });
    await logAutomation(db, "autoridade-sync", {
      detalhe: { data: out.data, dominios: out.dominios },
      resultado: { rowsUpserted: out.rowsUpserted, semDados: out.semDados, errors: out.errors },
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
