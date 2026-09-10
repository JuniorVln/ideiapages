import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import type { User } from "@supabase/supabase-js";
import { getAdminAllowlist } from "./allowlist";
import { getLocalBypassAdminUser, isAdminLocalBypass } from "./local-bypass";

/** Sessão admin ou null (para route handlers sem redirect). */
export async function getAdminUser(): Promise<User | null> {
  if (isAdminLocalBypass()) return getLocalBypassAdminUser();

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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() ?? "";
  const allow = getAdminAllowlist();
  if (!user || !allow.includes(email)) return null;
  return user;
}
