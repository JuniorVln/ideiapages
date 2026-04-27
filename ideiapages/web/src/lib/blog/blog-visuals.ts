import { cache } from "react";
import { getSupabasePublicReadClient } from "@/lib/supabase/public";
import type { PaginaImagensContexto } from "@/lib/blog/briefing-imagens";
import {
  buildPexelsQuery,
  PEXELS_STOCK_IMAGES,
  pexelsDiversifyIndex,
  pexelsIsUrlUsed,
  pexelsMarkUrlUsed,
  pexelsSeedUsedSet,
  searchPexelsPhoto,
  searchPexelsPhotoExcluding,
} from "@/lib/pexels";

export const getTermoKeyword = cache(async (termoId: string | null): Promise<string | null> => {
  if (!termoId) return null;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ) {
    return null;
  }
  const supabase = getSupabasePublicReadClient();
  const { data, error } = await supabase
    .from("termos")
    .select("keyword")
    .eq("id", termoId)
    .maybeSingle();
  if (error || !data?.keyword) return null;
  return data.keyword;
});

export type BlogVisuals = {
  heroSrc: string | null;
  heroAlt: string;
  heroCredit: string | null;
  inlineSrc: string | null;
  inlineAlt: string;
  inlineCredit: string | null;
};

function parseImagensContexto(raw: unknown): PaginaImagensContexto | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const hero = typeof o.hero_query === "string" ? o.hero_query.trim() : "";
  const inline = typeof o.inline_query === "string" ? o.inline_query.trim() : "";
  if (!hero && !inline) return null;
  return {
    hero_query: hero || inline,
    inline_query: inline || hero,
  };
}

export const getBlogVisuals = cache(
  async (opts: {
    titulo: string;
    focusKeyword: string | null;
    ogImageUrl: string | null;
    /** Preenchido no compose a partir do briefing (keyword + LSI). */
    imagensContextoJsonb?: unknown;
  }): Promise<BlogVisuals> => {
    const baseAlt = opts.titulo;
    const ctx = parseImagensContexto(opts.imagensContextoJsonb);
    const q1 = ctx?.hero_query?.length
      ? ctx.hero_query
      : buildPexelsQuery(opts.titulo, opts.focusKeyword);
    /** Inline / faixa: query distinta do hero (briefing força LSI; fallback explícito). */
    const q2 = ctx?.inline_query?.length
      ? ctx.inline_query
      : `${buildPexelsQuery(opts.titulo, opts.focusKeyword)} people collaboration modern workspace meeting`;

    const heroIdx = pexelsDiversifyIndex(`${opts.titulo}|${opts.focusKeyword ?? ""}|hero`, 12);
    const inlineIdx = pexelsDiversifyIndex(`${opts.titulo}|${opts.focusKeyword ?? ""}|inline`, 12);

    let heroSrc = opts.ogImageUrl;
    let heroAlt = baseAlt;
    let heroCredit: string | null = null;

    if (!heroSrc) {
      const p = await searchPexelsPhoto({
        query: q1,
        orientation: "landscape",
        resultIndex: heroIdx,
      });
      if (p) {
        heroSrc = p.src;
        heroAlt = p.alt || baseAlt;
        heroCredit = p.photographer;
      }
    }

    if (!heroSrc) {
      heroSrc = PEXELS_STOCK_IMAGES.hero;
      heroAlt = `${baseAlt} — ${PEXELS_STOCK_IMAGES.heroAlt}`;
      heroCredit = PEXELS_STOCK_IMAGES.credit;
    }

    let inlineSrc: string | null = null;
    let inlineAlt = "Ilustração relacionada à oferta";
    let inlineCredit: string | null = null;

    const heroEx = pexelsSeedUsedSet([heroSrc].filter(Boolean) as string[]);
    const heroOnly = pexelsSeedUsedSet(heroSrc ? [heroSrc] : []);

    const p2 = await searchPexelsPhotoExcluding(
      {
        query: q2,
        orientation: "landscape",
        resultIndex: ctx ? (2 + inlineIdx) % 12 : (1 + inlineIdx) % 12,
        page: 1,
      },
      heroEx,
    );
    if (p2?.src) {
      pexelsMarkUrlUsed(heroEx, p2.src);
      inlineSrc = p2.src;
      inlineAlt = p2.alt || inlineAlt;
      inlineCredit = p2.photographer;
    }

    if (!inlineSrc || (inlineSrc && pexelsIsUrlUsed(inlineSrc, heroOnly))) {
      const p3 = await searchPexelsPhotoExcluding(
        {
          query: `${q2} team diversity`,
          orientation: "landscape",
          resultIndex: (4 + inlineIdx + heroIdx) % 12,
          page: 2,
        },
        heroEx,
      );
      if (p3?.src) {
        pexelsMarkUrlUsed(heroEx, p3.src);
        inlineSrc = p3.src;
        inlineAlt = p3.alt || inlineAlt;
        inlineCredit = p3.photographer;
      }
    }

    if (!inlineSrc || (inlineSrc && pexelsIsUrlUsed(inlineSrc, heroOnly))) {
      if (!pexelsIsUrlUsed(PEXELS_STOCK_IMAGES.inline, heroEx)) {
        inlineSrc = PEXELS_STOCK_IMAGES.inline;
        inlineAlt = PEXELS_STOCK_IMAGES.inlineAlt;
        inlineCredit = PEXELS_STOCK_IMAGES.credit;
        pexelsMarkUrlUsed(heroEx, PEXELS_STOCK_IMAGES.inline);
      }
    }

    return {
      heroSrc,
      heroAlt,
      heroCredit,
      inlineSrc,
      inlineAlt,
      inlineCredit,
    };
  }
);
