import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/** Classifica termos `coletado` → Claude (→ `analisado`). */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!isResearchCliAllowed()) {
    return NextResponse.json(
      {
        error:
          "Desativado neste ambiente. Use NODE_ENV=development ou ALLOW_ADMIN_RESEARCH_CLI=1 (local).",
      },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    batchSize?: number;
    maxBatches?: number;
    dryRun?: boolean;
    reclassify?: boolean;
  };
  const batchSize = Math.min(200, Math.max(1, Math.floor(body.batchSize ?? 40)));
  const maxBatches = Math.min(100, Math.max(1, Math.floor(body.maxBatches ?? 5)));

  const subArgs = [
    "run",
    "ideiapages-research",
    "classify-terms",
    "--batch-size",
    String(batchSize),
    "--max-batches",
    String(maxBatches),
    "--yes",
  ];
  if (body.dryRun) subArgs.push("--dry-run");
  if (body.reclassify) subArgs.push("--reclassify");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs);
    return NextResponse.json({ ok: true, stdout: stdout || null, stderr: stderr || null });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      { ok: false, error: err.message ?? "Falha em classify-terms.", stderr: err.stderr, stdout: err.stdout },
      { status: 500 },
    );
  }
}
