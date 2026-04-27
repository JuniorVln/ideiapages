/** URL canónica do site. Trata `NEXT_PUBLIC_SITE_URL` vazio (evita `new URL("")` a rebentar o layout). */
export const DEFAULT_SITE_URL = "https://ideiamultichat.com.br";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const t = typeof raw === "string" ? raw.trim() : "";
  return t.length > 0 ? t : DEFAULT_SITE_URL;
}
