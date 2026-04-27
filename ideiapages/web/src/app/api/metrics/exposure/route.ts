import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";

const BodySchema = z.object({
  pagina_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
});

function todaySaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function POST(req: NextRequest) {
  try {
    const json: unknown = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
    }
    const { pagina_id, variacao_id } = parsed.data;
    const supabase = getSupabaseAdminOptional();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "supabase_unconfigured" }, { status: 503 });
    }

    const { data: pagina, error: pErr } = await supabase
      .from("paginas")
      .select("id, status")
      .eq("id", pagina_id)
      .single();

    if (pErr || !pagina || pagina.status !== "publicado") {
      return NextResponse.json({ ok: false, error: "pagina" }, { status: 404 });
    }

    const { data: variacao, error: vErr } = await supabase
      .from("variacoes")
      .select("id, pagina_id")
      .eq("id", variacao_id)
      .eq("pagina_id", pagina_id)
      .maybeSingle();

    if (vErr || !variacao) {
      return NextResponse.json({ ok: false, error: "variacao" }, { status: 404 });
    }

    const data = todaySaoPaulo();

    const { data: existing, error: qErr } = await supabase
      .from("metricas_diarias")
      .select("id, sessoes, pageviews")
      .eq("pagina_id", pagina_id)
      .eq("variacao_id", variacao_id)
      .eq("data", data)
      .maybeSingle();

    if (qErr) {
      console.error("[metrics/exposure] select", qErr.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (existing) {
      const { error: uErr } = await supabase
        .from("metricas_diarias")
        .update({
          sessoes: existing.sessoes + 1,
          pageviews: existing.pageviews + 1,
        })
        .eq("id", existing.id);

      if (uErr) {
        console.error("[metrics/exposure] update", uErr.message);
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    } else {
      const { error: iErr } = await supabase.from("metricas_diarias").insert({
        pagina_id,
        variacao_id,
        data,
        sessoes: 1,
        pageviews: 1,
        leads: 0,
        cliques_whatsapp: 0,
      });

      if (iErr) {
        console.error("[metrics/exposure] insert", iErr.message);
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[metrics/exposure]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
