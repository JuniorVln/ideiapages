import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/** Promove `analisado` (score ≥ min) → `priorizado`; ordena por score×(1+ln(1+volume)). Exclui decrescente salvo exceção. */
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
    minScore?: number;
    limit?: number;
    dryRun?: boolean;
    keepDecrescente?: boolean;
  };
  const minScore = Math.min(10, Math.max(1, Math.floor(body.minScore ?? 7)));
  const limit = Math.min(500, Math.max(1, Math.floor(body.limit ?? 50)));

  const subArgs = [
    "run",
    "ideiapages-research",
    "prioritize-terms",
    "--min-score",
    String(minScore),
    "--limit",
    String(limit),
  ];
  if (body.dryRun) subArgs.push("--dry-run");
  if (body.keepDecrescente) subArgs.push("--keep-decrescente");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs);
    return NextResponse.json({ ok: true, stdout: stdout || null, stderr: stderr || null });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      { ok: false, error: err.message ?? "Falha em prioritize-terms.", stderr: err.stderr, stdout: err.stdout },
      { status: 500 },
    );
  }
}
