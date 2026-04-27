import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/** Lote: SERP (Apify) para termos `priorizado` (e opc. `analisado`). */
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
    includeAnalisado?: boolean;
    pauseSeconds?: number;
  };
  const limit = Math.min(50, Math.max(1, Math.floor(body.limit ?? 20)));
  const topN = Math.min(50, Math.max(1, Math.floor(body.topN ?? 10)));
  const pause = Math.min(60, Math.max(0, Number(body.pauseSeconds ?? 3)));

  const subArgs = [
    "run",
    "ideiapages-research",
    "collect-serp",
    "--all-priorizados",
    "--limit",
    String(limit),
    "--top-n",
    String(topN),
    "--pause-seconds",
    String(pause),
    "--yes",
  ];
  if (body.dryRun) subArgs.push("--dry-run");
  if (body.force) subArgs.push("--force");
  if (body.includeAnalisado) subArgs.push("--include-analisado");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs);
    return NextResponse.json({ ok: true, stdout: stdout || null, stderr: stderr || null });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      { ok: false, error: err.message ?? "Falha em collect-serp.", stderr: err.stderr, stdout: err.stdout },
      { status: 500 },
    );
  }
}
