import type { User } from "@supabase/supabase-js";

/**
 * Em desenvolvimento (`pnpm dev`, NODE_ENV !== production): admin abre sem login.
 * Em produção (Vercel etc.): sempre exige Magic Link + allowlist.
 *
 * Para testar login no dev: ADMIN_LOCAL_BYPASS=false no .env.local
 */
export function isAdminLocalBypass(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const v = process.env.ADMIN_LOCAL_BYPASS?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") return false;
  return true;
}

/** Usuário sintético para Server Components / APIs quando bypass está ativo. */
export function getLocalBypassAdminUser(): User {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "dev-local@ideiapages.internal",
    email_confirmed_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
}
