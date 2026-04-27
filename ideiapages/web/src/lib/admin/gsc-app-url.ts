import type { NextRequest } from "next/server";

/**
 * Base pública (sem barra final) para redirect OAuth e instância OAuth2.
 * Preferir `NEXT_PUBLIC_SITE_URL` em produção; no dev cai no origin do pedido.
 */
export function getAppBaseUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return req.nextUrl.origin;
}
