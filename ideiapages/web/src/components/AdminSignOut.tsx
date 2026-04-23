"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";

export function AdminSignOut() {
  const router = useRouter();

  async function signOut() {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="text-sm text-slate-400 hover:text-white underline-offset-2 hover:underline"
    >
      Sair
    </button>
  );
}
