import type { User } from "@supabase/supabase-js";

/**
 * Admin sem login (Server Components + middleware alinhados):
 * - Dev (`NODE_ENV !== production`): por defeito bypass ativo.
 * - Produção: só com `ADMIN_LOCAL_BYPASS=true` (ou `1` / `yes`) — desligar antes de ir a público real.
 *
 * Para testar login real no dev: ADMIN_LOCAL_BYPASS=false no .env
 */
export function isAdminLocalBypass(): boolean {
  const v = process.env.ADMIN_LOCAL_BYPASS?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  if (process.env.NODE_ENV === "production") return false;
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
