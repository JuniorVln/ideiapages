import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAdminUser } from "@/lib/admin/session";
import {
  getResearchDir,
  isResearchCliAllowed,
  runIdeiaPagesResearchCli,
} from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/** Relativo à raiz `ideiapages/` (PROJECT_ROOT no Python). */
const SEED_REL = "research/data/tmp";

/**
 * Uma ação: escreve JSON de sementes e chama `run-pipeline` (Fase 0 completa, com --yes).
 * Pode levar muitos minutos; timeout 60 min.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isResearchCliAllowed()) {
    return NextResponse.json(
      {
        error:
          "Pipeline pelo painel desligado. Use development ou ALLOW_ADMIN_RESEARCH_CLI=1 (local / servidor controlado).",
      },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    seeds?: string[];
    dryRun?: boolean;
    /** Se true, não chama pytrends. */
    skipTrends?: boolean;
    /** Se true, para após scrape (não gera briefings / gaps). */
    skipGaps?: boolean;
  };

  const rawSeeds = Array.isArray(body.seeds) ? body.seeds : [];
  const seeds = rawSeeds
    .map((s) => String(s).trim())
    .filter((s) => s.length >= 2)
    .slice(0, 12);
  if (seeds.length === 0) {
    return NextResponse.json(
      { error: "Informe ao menos uma semente (2+ caracteres, máx. 12 linhas)." },
      { status: 400 },
    );
  }

  const researchDir = getResearchDir();
  const tmpDir = path.join(researchDir, "data", "tmp");
  await mkdir(tmpDir, { recursive: true });
  const name = `panel-seeds-${Date.now()}-${randomUUID()}.json`;
  const absPath = path.join(tmpDir, name);
  const relForCli = path.join(SEED_REL, name).split(path.sep).join("/");

  await writeFile(absPath, JSON.stringify({ seeds_termos: seeds }, null, 2), "utf-8");

  const subArgs = [
    "run",
    "ideiapages-research",
    "run-pipeline",
    "--seed-file",
    relForCli,
    "--yes",
    "--classify-max-batches",
    "20",
    "--classify-batch-size",
    "50",
    "--min-score",
    "7",
    "--prioritize-limit",
    "50",
    "--serp-limit",
    "30",
    "--serp-top-n",
    "10",
    "--scrape-limit",
    "25",
    "--gaps-limit",
    "15",
    "--max-seeds",
    String(seeds.length),
  ];
  if (body.dryRun) subArgs.push("--dry-run");
  if (body.skipTrends) subArgs.push("--skip-trends");
  if (body.skipGaps) subArgs.push("--skip-gaps");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs, { timeoutMs: 3_600_000 });
    return NextResponse.json({ ok: true, stdout: stdout || null, stderr: stderr || null, seeds });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string; code?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Falha no run-pipeline.",
        code: err.code,
        stderr: err.stderr,
        stdout: err.stdout,
        seeds,
      },
      { status: 500 },
    );
  } finally {
    try {
      await unlink(absPath);
    } catch {
      /* ignore */
    }
  }
}
