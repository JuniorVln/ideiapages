import { getAdminUser } from "@/lib/admin/session";
import { isResearchCliAllowed, runIdeiaPagesResearchCli } from "@/lib/admin/research-cli";
import { NextRequest, NextResponse } from "next/server";

/**
 * Dispara `collect-trends --keyword` (pytrends → `termos.tendencia_pytrends` + `volume_estimado` em proxy).
 * Pode levar minutos se o Google limitar (429); em ban, a CLI espera e retenta.
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
          "Trends via painel desativado neste ambiente. Use NODE_ENV=development ou ALLOW_ADMIN_RESEARCH_CLI=1 (local).",
      },
      { status: 403 },
    );
  }

  const body = (await req.json()) as { keyword?: string; force?: boolean };
  const keyword = (body.keyword ?? "").trim();
  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ error: "Keyword inválida." }, { status: 400 });
  }
  if (keyword.length > 200) {
    return NextResponse.json({ error: "Keyword muito longa." }, { status: 400 });
  }

  const subArgs = [
    "run",
    "ideiapages-research",
    "collect-trends",
    "--keyword",
    keyword,
    "--geo",
    "BR",
    "--pause-seconds",
    "3",
  ];
  if (body.force) subArgs.push("--force");

  try {
    const { stdout, stderr } = await runIdeiaPagesResearchCli(subArgs);
    return NextResponse.json({
      ok: true,
      stdout: stdout || null,
      stderr: stderr || null,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Falha ao executar collect-trends.",
        stderr: err.stderr,
        stdout: err.stdout,
      },
      { status: 500 },
    );
  }
}
