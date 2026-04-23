import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import type { User } from "@supabase/supabase-js";
import { getAdminAllowlist } from "./allowlist";

/** Sessão admin ou null (para route handlers sem redirect). */
export async function getAdminUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const cookieMethods: CookieMethodsServer = {
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      for (const { name, value, options } of toSet) {
        cookieStore.set(name, value, options);
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
