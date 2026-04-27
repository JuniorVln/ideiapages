import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export function isResearchCliAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_ADMIN_RESEARCH_CLI === "1" ||
    process.env.ALLOW_ADMIN_RESEARCH_CLI === "true"
  );
}

/**
 * Pasta `ideiapages/research` (pyproject com `ideiapages-research`).
 * Correr `pnpm dev` a partir de `ideiapages/web` → `../research` funciona; a partir de outras
 * pastas o cwd muda e o CLI subia com cwd errado (falhava com mensagem inútil).
 * Opcional: `IDEIAPAGES_RESEARCH_DIR` no .env.
 */
export function getResearchDir(): string {
  const override = process.env.IDEIAPAGES_RESEARCH_DIR?.trim();
  if (override) {
    return path.resolve(override);
  }
  const candidates = [
    path.resolve(process.cwd(), "..", "research"),
    path.resolve(process.cwd(), "research"),
    path.resolve(process.cwd(), "ideiapages", "research"),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "pyproject.toml"))) {
      return dir;
    }
  }
  return path.resolve(process.cwd(), "..", "research");
}

export type RunResearchCliOptions = {
  /** Padrão 10 min; use mais para `run-pipeline` completo. */
  timeoutMs?: number;
};

/** Executa `uv run ideiapages-research ...` na pasta research. */
export async function runIdeiaPagesResearchCli(
  subArgs: string[],
  options?: RunResearchCliOptions,
): Promise<{
  stdout: string;
  stderr: string;
}> {
  const researchDir = getResearchDir();
  const isWin = process.platform === "win32";
  const opts = {
    cwd: researchDir,
    env: process.env,
    timeout: options?.timeoutMs ?? 600_000,
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true as boolean,
  };

  if (!existsSync(path.join(researchDir, "pyproject.toml"))) {
    throw new Error(
      `Não encontrei ideiapages/research (pyproject.toml). cwd=${process.cwd()} dir=${researchDir}. ` +
        "Corra o Next a partir de ideiapages/web ou defina IDEIAPAGES_RESEARCH_DIR no .env."
    );
  }

  try {
    const { stdout, stderr } = isWin
      ? await execFileAsync("cmd.exe", ["/c", "uv", ...subArgs], opts)
      : await execFileAsync("uv", subArgs, opts);

    return {
      stdout: typeof stdout === "string" ? stdout : String(stdout),
      stderr: typeof stderr === "string" ? stderr : String(stderr),
    };
  } catch (e: unknown) {
    const ex = e as { message?: string; stdout?: string | Buffer; stderr?: string | Buffer };
    const out = ex.stdout != null ? String(ex.stdout) : "";
    const errS = ex.stderr != null ? String(ex.stderr) : "";
    const text = [ex.message, errS, out].filter((x) => x && x.trim().length > 0).join("\n\n");
    const wrapped = new Error(text || (ex as Error).message) as Error & {
      stdout: string;
      stderr: string;
    };
    wrapped.stdout = out;
    wrapped.stderr = errS;
    throw wrapped;
  }
}
