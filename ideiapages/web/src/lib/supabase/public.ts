import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let _publicRead: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Anon key sem cookies de sessão. Usar em leituras públicas (ex.: páginas em /blog/*) para o resultado
 * não depender do JWT do visitante (sessão expirada / cabeçalhos inválidos podem fazer
 * a query falhar com anon+RLS, parecendo 404 mesmo com página publicada).
 */
export function getSupabasePublicReadClient() {
  if (_publicRead) return _publicRead;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessários.");
  }
  _publicRead = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return _publicRead;
}
