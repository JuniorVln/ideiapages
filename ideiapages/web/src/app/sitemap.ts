import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ideiamultichat.com.br",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
