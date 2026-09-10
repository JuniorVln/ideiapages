import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  const cookieMethods: CookieMethodsServer = {
    getAll: () => cookieStore.getAll(),
    // Server Component não pode escrever cookie: quando o access_token expira, o
    // supabase-ssr tenta gravar o token renovado aqui e o Next lança
    // "Cookies can only be modified in a Server Action or Route Handler",
    // derrubando a página inteira com 500. Engolir o erro é o padrão do Supabase:
    // a renovação real acontece no /auth/callback e no client. (10/09/2026)
    setAll: (toSet) => {
      try {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        /* leitura em Server Component — sessão segue válida em memória */
      }
    },
  };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods },
  );
}
