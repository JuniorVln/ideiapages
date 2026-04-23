import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

const LeadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().email("E-mail inválido."),
  telefone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(11)),
  pagina_id: z.string().uuid(),
  variacao_id: z.string().uuid().nullable().optional(),
  utms: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_content: z.string().optional(),
      utm_term: z.string().optional(),
    })
    .optional()
    .default({}),
});

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Sempre usa `NEXT_PUBLIC_WHATSAPP_NUMBER` (nunca o telefone do lead). */
function buildWhatsappRedirectUrl(keyword?: string | null): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";
  const digits = raw.replace(/\D/g, "");
  const msg = keyword
    ? `Olá! Vi sobre "${keyword}" e gostaria de saber mais sobre o Ideia Chat.`
    : "Olá! Gostaria de saber mais sobre o Ideia Chat.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

function isDuplicateLeadError(message: string, code?: string): boolean {
  return (
    code === "23505" ||
    message.includes("lead_duplicate") ||
    message.includes("lead_duplicate_within_5min")
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ success: false, error: message }, { status: 422 });
    }

    const { nome, email, telefone, pagina_id, variacao_id, utms } = parsed.data;

    const supabase = getSupabaseAdmin();

    const { data: pagina, error: paginaError } = await supabase
      .from("paginas")
      .select("titulo, status")
      .eq("id", pagina_id)
      .single();

    if (paginaError || !pagina || pagina.status !== "publicado") {
      return NextResponse.json(
        { success: false, error: "Página não encontrada ou indisponível." },
        { status: 404 }
      );
    }

    const keyword = pagina.titulo;

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .eq("telefone", telefone)
      .eq("pagina_id", pagina_id)
      .gte("criado_em", fiveMinAgo)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        redirect_url: buildWhatsappRedirectUrl(keyword),
      });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? "";

    const leadRow: Database["public"]["Tables"]["leads"]["Insert"] = {
      nome,
      email,
      telefone,
      pagina_id,
      variacao_id: variacao_id ?? null,
      utm_source: utms.utm_source ?? null,
      utm_medium: utms.utm_medium ?? null,
      utm_campaign: utms.utm_campaign ?? null,
      utm_content: utms.utm_content ?? null,
      utm_term: utms.utm_term ?? null,
      ip_hash: hashValue(ip),
      user_agent_hash: hashValue(userAgent),
    };

    const { error: insertError } = await supabase.from("leads").insert(leadRow);

    if (insertError) {
      if (isDuplicateLeadError(insertError.message, insertError.code)) {
        return NextResponse.json({
          success: true,
          redirect_url: buildWhatsappRedirectUrl(keyword),
        });
      }
      console.error("[leads] insert error:", insertError.message);
      return NextResponse.json(
        { success: false, error: "Erro ao registrar lead. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redirect_url: buildWhatsappRedirectUrl(keyword),
    });
  } catch (err) {
    console.error("[leads] unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
