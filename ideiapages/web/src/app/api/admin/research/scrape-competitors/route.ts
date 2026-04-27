import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/** Lote: raspa concorrentes (Firecrawl) para termos `snapshot_serp_ok`. */
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
    limit?: number;
    topN?: number;
    dryRun?: boolean;
    force?: boolean;
    maxConcurrent?: number;
  };
  const limit = Math.min(100, Math.max(1, Math.floor(body.limit ?? 15)));
  const topN = Math.min(10, Math.max(1, Math.floor(body.topN ?? 10)));
  const maxConcurrent = Math.min(5, Math.max(1, Math.floor(body.maxConcurrent ?? 3)));

  const subArgs = [
    "run",
    "ideiapages-research",
    "scrape-competitors",
    "--all-pending",
    "--limit",
    String(limit),
    "--top-n",
    String(topN),
    "--max-concurrent",
    String(maxConcurrent),
    "--yes",
  ];
  if (body.dryRun) subArgs.push("--dry-run");
  if (body.force) subArgs.push("--force");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs);
    return NextResponse.json({ ok: true, stdout: stdout || null, stderr: stderr || null });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Falha em scrape-competitors.",
        stderr: err.stderr,
        stdout: err.stdout,
      },
      { status: 500 },
    );
  }
}
