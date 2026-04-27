import type { MetadataRoute } from "next";
import { getSupabasePublicReadClient } from "@/lib/supabase/public";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE_URL = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}${PUBLIC_CONTENT_BASE_PATH}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const supabase = getSupabasePublicReadClient();

    const { data: paginas } = await supabase
      .from("paginas")
      .select("slug, publicado_em, atualizado_em")
      .eq("status", "publicado")
      .order("publicado_em", { ascending: false });

    if (paginas) {
      const blogEntries: MetadataRoute.Sitemap = paginas.map((p) => ({
        url: `${SITE_URL}${PUBLIC_CONTENT_BASE_PATH}/${p.slug}`,
        lastModified: new Date(p.atualizado_em ?? p.publicado_em ?? new Date()),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
      return [...base, ...blogEntries];
    }
  } catch (err) {
    console.error("[sitemap] error fetching paginas:", err);
  }

  return base;
}
