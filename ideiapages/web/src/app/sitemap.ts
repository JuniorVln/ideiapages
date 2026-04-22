import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ideiamultichat.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: paginas } = await supabase
      .from("paginas")
      .select("slug, publicado_em, atualizado_em")
      .eq("status", "publicado")
      .order("publicado_em", { ascending: false });

    if (paginas) {
      const blogEntries: MetadataRoute.Sitemap = paginas.map((p) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
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
