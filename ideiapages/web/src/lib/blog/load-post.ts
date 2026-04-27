import { cache } from "react";
import { getPagina, type PaginaComVariacoes } from "./get-pagina";
import { getBlogVisuals, getTermoKeyword, type BlogVisuals } from "./blog-visuals";

export type BlogPostPayload = {
  pagina: PaginaComVariacoes;
  focusKeyword: string | null;
  visuals: BlogVisuals;
};

export const loadBlogPost = cache(async (rawSlug: string): Promise<BlogPostPayload | null> => {
  const pagina = await getPagina(rawSlug);
  if (!pagina) return null;
  const focusKeyword = await getTermoKeyword(pagina.termo_id ?? null);
  const visuals = await getBlogVisuals({
    titulo: pagina.titulo,
    focusKeyword,
    ogImageUrl: pagina.og_image_url,
    imagensContextoJsonb: pagina.imagens_contexto_jsonb,
  });
  return { pagina, focusKeyword, visuals };
});
