import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

function normalizeSeeds(body: { seed?: string; seeds?: string[] }): string[] {
  if (Array.isArray(body.seeds) && body.seeds.length > 0) {
    return body.seeds
      .map((s) => String(s).trim())
      .filter((s) => s.length >= 2)
      .slice(0, 12);
  }
  const one = (body.seed ?? "").trim();
  return one.length >= 2 ? [one] : [];
}

/**
 * Dispara `collect-autocomplete` (Apify + Supabase). Aceita uma semente ou várias (máx. 12).
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
          "Coleta via painel desativada neste ambiente. Use NODE_ENV=development ou ALLOW_ADMIN_RESEARCH_CLI=1 (local).",
      },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    seed?: string;
    seeds?: string[];
    dryRun?: boolean;
    force?: boolean;
  };

  const seeds = normalizeSeeds(body);
  if (seeds.length === 0) {
    return NextResponse.json(
      { error: "Informe ao menos uma semente (2+ caracteres). Máximo 12 por envio." },
      { status: 400 },
    );
  }
  for (const s of seeds) {
    if (s.length > 200) {
      return NextResponse.json({ error: `Semente muito longa (máx. 200): ${s.slice(0, 40)}…` }, { status: 400 });
    }
  }

  const outs: string[] = [];
  let lastStderr = "";

  try {
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]!;
      const subArgs = [
        "run",
        "ideiapages-research",
        "collect-autocomplete",
        "--seed",
        seed,
        "--limit",
        "50",
        "--no-input",
        "--pause-seconds",
        i < seeds.length - 1 ? "2" : "0",
      ];
      if (body.dryRun) subArgs.push("--dry-run");
      if (body.force) subArgs.push("--force");

      const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs);
      outs.push(`=== Semente ${i + 1}/${seeds.length}: ${seed} ===\n${stdout || "(sem stdout)"}`);
      if (stderr) lastStderr = stderr;
    }

    return NextResponse.json({
      ok: true,
      seeds,
      stdout: outs.join("\n\n"),
      stderr: lastStderr || null,
    });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; stdout?: string; stderr?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Falha ao executar a coleta.",
        code: err.code,
        stdout: err.stdout,
        stderr: err.stderr,
        partialLog: outs.join("\n\n"),
      },
      { status: 500 },
    );
  }
}
