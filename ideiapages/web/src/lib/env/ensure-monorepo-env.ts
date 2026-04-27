import { existsSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Garante `process.env` com variáveis do monorepo (ex. `ideiapages/.env`) quando
 * o Next corre a partir de `ideiapages/web/`. A Vercel injeta tudo no deploy — aí no-op.
 */
let cached = false;

export function ensureMonorepoEnv(): void {
  if (cached) return;
  if (process.env.VERCEL) {
    cached = true;
    return;
  }
  try {
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const webRoot = path.join(thisDir, "..", "..", "..");
    const monorepoRoot = path.join(webRoot, "..");
    if (existsSync(path.join(monorepoRoot, ".env")) || existsSync(path.join(monorepoRoot, ".env.local"))) {
      loadEnvConfig(monorepoRoot);
    } else if (existsSync(path.join(webRoot, ".env.local")) || existsSync(path.join(webRoot, ".env"))) {
      loadEnvConfig(webRoot);
    } else {
      loadEnvConfig(monorepoRoot);
    }
  } catch {
    /* melhor esforço — next.config.ts também carrega .env */
  }
  cached = true;
}

export function hasSeedAssistantKeys(): boolean {
  return (
    Boolean(process.env.FIRECRAWL_API_KEY?.trim()) &&
    Boolean(process.env.ANTHROPIC_API_KEY?.trim())
  );
}
