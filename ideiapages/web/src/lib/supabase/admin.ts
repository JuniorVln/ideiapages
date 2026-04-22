import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let _admin: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Cliente Supabase com service_role.
 * NUNCA importar isto em código que vai pro client.
 * Apenas em route handlers e server actions.
 */
export function getSupabaseAdmin(): ReturnType<typeof createClient<Database>> {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos.");
  }
  _admin = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
