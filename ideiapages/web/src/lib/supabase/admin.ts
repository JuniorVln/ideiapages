import { createClient } from "@supabase/supabase-js";

let _admin: ReturnType<typeof createClient> | null = null;

/**
 * Cliente Supabase com service_role.
 * NUNCA importar isto em código que vai pro client.
 * Apenas em route handlers e server actions.
 */
export function getSupabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos.");
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
