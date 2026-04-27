import { getAdminUser } from "@/lib/admin/session";
import { ensureMonorepoEnv, hasSeedAssistantKeys } from "@/lib/env/ensure-monorepo-env";
import { NextResponse } from "next/server";

/**
 * Lê o ambiente no momento do pedido (evita o Server Component a “congelar” vazio no build / Turbopack).
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  ensureMonorepoEnv();
  return NextResponse.json({
    ready: hasSeedAssistantKeys(),
    hasFirecrawl: Boolean(process.env.FIRECRAWL_API_KEY?.trim()),
    hasAnthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  });
}
