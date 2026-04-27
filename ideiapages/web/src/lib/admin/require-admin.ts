import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import type { User } from "@supabase/supabase-js";
import { getAdminAllowlist } from "./allowlist";
import { getLocalBypassAdminUser, isAdminLocalBypass } from "./local-bypass";

export async function requireAdmin(): Promise<User> {
  if (isAdminLocalBypass()) return getLocalBypassAdminUser();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const cookieMethods: CookieMethodsServer = {
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      for (const { name, value, options } of toSet) {
        cookieStore.set(name, value, options);
      }
    },
  };

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allow = getAdminAllowlist();
  const email = user?.email?.toLowerCase() ?? "";

  if (!user || !allow.includes(email)) {
    redirect("/admin/login");
  }

  return user;
}
