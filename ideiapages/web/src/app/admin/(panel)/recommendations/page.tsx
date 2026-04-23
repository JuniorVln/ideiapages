import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminRecommendationsPage() {
  await requireAdmin();
  const db = getSupabaseAdmin();

  const { data: termos } = await db
    .from("termos")
    .select("id, keyword, score_conversao, cluster, intencao")
    .eq("status", "briefing_pronto")
    .order("score_conversao", { ascending: false, nullsFirst: false })
    .limit(80);

  const { data: paginas } = await db.from("paginas").select("termo_id");

  const publishedTermo = new Set(
    (paginas ?? []).map((p) => p.termo_id).filter(Boolean) as string[],
  );

  const candidatos = (termos ?? []).filter((t) => !publishedTermo.has(t.id)).slice(0, 25);

  const { data: expPages } = await db
    .from("paginas")
    .select("id, slug, titulo, status_experimento")
    .eq("status", "publicado")
    .eq("status_experimento", "ativo");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Recomendações</h1>
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Próximas páginas (briefing pronto, sem publicar)</h2>
        {candidatos.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum termo candidato ou todos já têm página.</p>
        ) : (
          <ul className="space-y-2 text-slate-300 text-sm">
            {candidatos.map((t) => (
              <li key={t.id}>
                <span className="text-slate-500 font-mono text-xs">{t.id.slice(0, 8)}…</span>{" "}
                <strong className="text-white">{t.keyword}</strong>
                {t.score_conversao != null && (
                  <span className="text-slate-500"> · score {t.score_conversao}</span>
                )}
                {t.cluster && <span className="text-slate-500"> · {t.cluster}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Experimentos ativos (refresh A/B)</h2>
        {(expPages ?? []).length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhuma página com experimento ativo.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-300">
            {(expPages ?? []).map((p) => (
              <li key={p.id}>
                <strong className="text-white">{p.slug}</strong> — {p.titulo}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
