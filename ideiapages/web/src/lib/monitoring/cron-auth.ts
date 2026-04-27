import type { NextRequest } from "next/server";

/**
 * Protege rotas `/api/cron/*` com `CRON_SECRET` (header `Authorization: Bearer` ou query `?secret=`).
 */
export function isValidCronRequest(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === expected;
}

export function cronAuthErrorResponse() {
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
