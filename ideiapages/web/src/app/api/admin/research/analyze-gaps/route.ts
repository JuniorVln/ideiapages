import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/** Gera briefing(s) via analyze-gaps (Claude): um termo (`termo_id`) ou lote `--all-scraped`. */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!isResearchCliAllowed()) {
    return NextResponse.json(
      { error: "Desativado neste ambiente. Use NODE_ENV=development ou ALLOW_ADMIN_RESEARCH_CLI=1." },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    termo_id?: string;
    limit?: number;
    topN?: number;
    dryRun?: boolean;
    force?: boolean;
  };
  const limit = Math.min(100, Math.max(1, Math.floor(body.limit ?? 5)));
  const topN = Math.min(10, Math.max(1, Math.floor(body.topN ?? 10)));
  const termoId = body.termo_id?.trim();

  const subArgs = termoId
    ? [
        "run",
        "ideiapages-research",
        "analyze-gaps",
        "--termo-id",
        termoId,
        "--top-n",
        String(topN),
        "--yes",
      ]
    : [
        "run",
        "ideiapages-research",
        "analyze-gaps",
        "--all-scraped",
        "--limit",
        String(limit),
        "--top-n",
        String(topN),
        "--yes",
      ];
  if (body.dryRun) subArgs.push("--dry-run");
  if (body.force) subArgs.push("--force");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs, { timeoutMs: 900_000 });
    return NextResponse.json({ ok: true, stdout: stdout || null, stderr: stderr || null });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Falha em analyze-gaps.",
        stderr: err.stderr ?? null,
        stdout: err.stdout ?? null,
      },
      { status: 500 },
    );
  }
}
