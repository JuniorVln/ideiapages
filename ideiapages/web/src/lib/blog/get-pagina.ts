import { getSupabasePublicReadClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/database.types";

export type VariacaoPagina = Pick<
  Tables<"variacoes">,
  "id" | "nome" | "ativa" | "provider" | "peso_trafego" | "corpo_mdx"
>;

export type PaginaComVariacoes = Tables<"paginas"> & { variacoes: VariacaoPagina[] };

export function normalizeBlogSlugParam(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

export async function getPagina(rawSlug: string): Promise<PaginaComVariacoes | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[paginas-publicas] Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ex.: no .env da pasta ideiapages).",
      );
    }
    return null;
  }

  const slug = normalizeBlogSlugParam(rawSlug);
  const supabase = getSupabasePublicReadClient();

  let pagina: Tables<"paginas"> | null = null;
  {
    const { data, error } = await supabase
      .from("paginas")
      .select("*")
      .eq("status", "publicado")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[paginas-publicas] paginas (slug):", error.message);
      }
      return null;
    }
    pagina = data;
  }

  if (!pagina) {
    const { data: rows, error: ilikeErr } = await supabase
      .from("paginas")
      .select("*")
      .eq("status", "publicado")
      .ilike("slug", slug)
      .limit(2);
    if (ilikeErr || !rows?.length) return null;
    if (rows.length > 1) return null;
    pagina = rows[0] as Tables<"paginas">;
  }

  const { data: variacoesRaw, error: vErr } = await supabase
    .from("variacoes")
    .select("id, nome, ativa, provider, peso_trafego, corpo_mdx")
    .eq("pagina_id", pagina.id);

  if (vErr) {
    if (process.env.NODE_ENV === "development") {
      console.error("[paginas-publicas] variacoes:", vErr.message);
    }
  }

  const variacoes = (vErr || !variacoesRaw ? [] : variacoesRaw) as VariacaoPagina[];
  return { ...pagina, variacoes };
}
