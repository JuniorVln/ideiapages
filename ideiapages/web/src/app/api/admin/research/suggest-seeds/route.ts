import { getAdminUser } from "@/lib/admin/session";
import { ensureMonorepoEnv } from "@/lib/env/ensure-monorepo-env";
import { scrapeUrlToMarkdown } from "@/lib/research/firecrawl-scrape";
import { assertPublicHttpUrl } from "@/lib/research/public-url";
import { suggestSeedsFromContext } from "@/lib/research/suggest-seeds-llm";
import { NextRequest, NextResponse } from "next/server";

/**
 * 1) Firecrawl: lê a página. 2) Claude (Haiku): gera sementes + resumo.
 * Opcional: consultas (Search Console) — coladas à mão ou preenchidas por "Importar do GSC".
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  ensureMonorepoEnv();

  const key = process.env.FIRECRAWL_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json(
      { error: "FIRECRAWL_API_KEY não configurada (web .env / ambiente)." },
      { status: 503 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada — necessária para extrair sementes." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as { url?: string; gscQueriesText?: string };
  let url: string;
  try {
    url = assertPublicHttpUrl(body.url ?? "");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "URL inválida" },
      { status: 400 },
    );
  }

  const gscQueries = (body.gscQueriesText ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 50);

  try {
    const pageMarkdown = await scrapeUrlToMarkdown(url, key);
    const { contexto_resumo, seeds } = await suggestSeedsFromContext({
      siteUrl: url,
      pageMarkdown,
      gscQueries: gscQueries.length > 0 ? gscQueries : undefined,
    });
    return NextResponse.json({
      ok: true,
      contextoResumo: contexto_resumo,
      seeds,
      meta: { markdownChars: pageMarkdown.length, gscQueriesUsadas: gscQueries.length },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao sugerir sementes";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
