import { getAdminUser } from "@/lib/admin/session";
import type { Database } from "@/lib/database.types";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type AutomationStateUpdate = Database["public"]["Tables"]["automation_state"]["Update"];

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  const { data, error } = await db.from("automation_state").select("*").eq("id", 1).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ state: data });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  const body = (await req.json()) as {
    automations_paused?: boolean;
    pause_reason?: string | null;
    custo_max_dia_brl?: number;
  };
  const patch: AutomationStateUpdate = { updated_at: new Date().toISOString() };
  if (typeof body.automations_paused === "boolean") {
    patch.automations_paused = body.automations_paused;
    if (body.automations_paused && body.pause_reason) {
      patch.pause_reason = body.pause_reason;
    }
    if (!body.automations_paused) {
      patch.pause_reason = null;
    }
  }
  if (typeof body.custo_max_dia_brl === "number" && body.custo_max_dia_brl >= 0) {
    patch.custo_max_dia_brl = body.custo_max_dia_brl;
  }
  const { data, error } = await db.from("automation_state").update(patch).eq("id", 1).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, state: data });
}
