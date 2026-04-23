import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/session";
import { toCsv } from "@/lib/admin/csv";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "paginas";
  const db = getSupabaseAdmin();

  if (type === "paginas") {
    const { data, error } = await db
      .from("paginas")
      .select(
        "id, slug, titulo, status, status_experimento, termo_id, variacao_vencedora_id, publicado_em, criado_em, atualizado_em",
      )
      .order("atualizado_em", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "id",
      "slug",
      "titulo",
      "status",
      "status_experimento",
      "termo_id",
      "variacao_vencedora_id",
      "publicado_em",
      "criado_em",
      "atualizado_em",
    ];
    const rows = (data ?? []).map((p) => [
      p.id,
      p.slug,
      p.titulo,
      p.status,
      p.status_experimento ?? "",
      p.termo_id ?? "",
      p.variacao_vencedora_id ?? "",
      p.publicado_em ?? "",
      p.criado_em,
      p.atualizado_em,
    ]);

    const csv = toCsv(headers, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ideiapages-paginas.csv"',
      },
    });
  }

  if (type === "variacoes") {
    const { data, error } = await db
      .from("variacoes")
      .select(
        "id, pagina_id, nome, provider, ativa, prompt_version, model_version, tokens_input, tokens_output, custo_estimado_usd, criado_em",
      )
      .order("criado_em", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "id",
      "pagina_id",
      "nome",
      "provider",
      "ativa",
      "prompt_version",
      "model_version",
      "tokens_input",
      "tokens_output",
      "custo_estimado_usd",
      "criado_em",
    ];
    const rows = (data ?? []).map((v) => [
      v.id,
      v.pagina_id,
      v.nome,
      v.provider,
      v.ativa ? 1 : 0,
      v.prompt_version,
      v.model_version ?? "",
      v.tokens_input ?? "",
      v.tokens_output ?? "",
      v.custo_estimado_usd ?? "",
      v.criado_em,
    ]);

    const csv = toCsv(headers, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ideiapages-variacoes.csv"',
      },
    });
  }

  if (type === "metricas") {
    const { data, error } = await db
      .from("metricas_diarias")
      .select(
        "id, pagina_id, variacao_id, data, sessoes, pageviews, leads, cliques_whatsapp, criado_em",
      )
      .order("data", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "id",
      "pagina_id",
      "variacao_id",
      "data",
      "sessoes",
      "pageviews",
      "leads",
      "cliques_whatsapp",
      "criado_em",
    ];
    const rows = (data ?? []).map((m) => [
      m.id,
      m.pagina_id,
      m.variacao_id ?? "",
      m.data,
      m.sessoes,
      m.pageviews,
      m.leads,
      m.cliques_whatsapp,
      m.criado_em,
    ]);

    const csv = toCsv(headers, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ideiapages-metricas-diarias.csv"',
      },
    });
  }

  if (type === "leads_privacy") {
    const { data, error } = await db
      .from("leads")
      .select(
        "id, pagina_id, variacao_id, criado_em, utm_source, utm_medium, utm_campaign, utm_content, utm_term, nome, email, telefone",
      )
      .order("criado_em", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "id",
      "pagina_id",
      "variacao_id",
      "criado_em",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "email_sha256",
      "telefone_last4",
      "nome_length",
    ];
    const rows = (data ?? []).map((l) => [
      l.id,
      l.pagina_id ?? "",
      l.variacao_id ?? "",
      l.criado_em,
      l.utm_source ?? "",
      l.utm_medium ?? "",
      l.utm_campaign ?? "",
      l.utm_content ?? "",
      l.utm_term ?? "",
      sha256Hex((l.email ?? "").toLowerCase().trim()),
      (l.telefone ?? "").replace(/\D/g, "").slice(-4) || "",
      (l.nome ?? "").length,
    ]);

    const csv = toCsv(headers, rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ideiapages-leads-pseudonimizado.csv"',
      },
    });
  }

  return NextResponse.json(
    { error: "type inválido. Use paginas | variacoes | metricas | leads_privacy" },
    { status: 400 },
  );
}
