import type { Database, Json } from "@/lib/database.types";
import type { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient<Database>>;

export async function logAutomation(
  db: AdminClient,
  behavior: string,
  detail: { pagina_id?: string | null; detalhe?: Json; resultado?: Json },
) {
  const { error } = await db.from("automation_log").insert({
    behavior,
    pagina_id: detail.pagina_id ?? null,
    detalhe: detail.detalhe ?? null,
    resultado: detail.resultado ?? null,
  });
  if (error) {
    console.error("[automation_log]", behavior, error.message);
  }
}
