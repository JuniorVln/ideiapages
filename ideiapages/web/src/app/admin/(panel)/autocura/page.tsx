import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { AutocuraClient } from "./AutocuraClient";

export const metadata = {
  title: "Autocura · IDeiaPages",
};

export default async function AutocuraPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) {
    return <AdminNeedSupabaseEnv />;
  }

  const gscUser = process.env.GSC_SYNC_USER_ID?.trim();
  const gscSite = process.env.GSC_SITE_URL?.trim();
  const cron = process.env.CRON_SECRET?.trim();
  const gscEnvOk = Boolean(gscUser && gscSite);
  const cronOk = Boolean(cron);
  const gscEnvMessage = !gscUser
    ? "Defina GSC_SYNC_USER_ID (UUID do utilizador admin que ligou o Google Search Console) no ambiente do servidor."
    : !gscSite
      ? "Defina GSC_SITE_URL (ex.: https://seusite.com.br/ ou sc-domain:seusite.com.br) com a mesma propriedade que vês na GSC."
      : "";
  const cronHint =
    gscEnvOk && !cronOk
      ? "Defina CRON_SECRET no deploy para proteger GET /api/cron/* (a Vercel envia Authorization: Bearer)."
      : "";

  const [{ data: state }, { data: queue }] = await Promise.all([
    db.from("automation_state").select("*").eq("id", 1).maybeSingle(),
    db
      .from("auto_rewrite_queue")
      .select("id, status, razao, prioridade, criado_em, paginas:pagina_id ( slug, titulo )")
      .order("criado_em", { ascending: false })
      .limit(30),
  ]);

  const rows =
    (queue ?? []) as {
      id: string;
      status: string;
      razao: string;
      prioridade: number;
      criado_em: string;
      paginas: { slug: string; titulo: string } | null;
    }[];

  return (
    <AutocuraClient
      initialState={state as never}
      initialQueue={rows}
      gscEnvOk={gscEnvOk}
      gscEnvMessage={gscEnvMessage}
      cronHint={cronHint}
    />
  );
}
