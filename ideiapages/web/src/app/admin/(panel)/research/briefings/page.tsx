import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import {
  briefingLsiStrings,
  briefingPageTitle,
  briefingTopicosStrings,
} from "@/lib/research/briefing-json";
import Link from "next/link";

import { BriefingCard } from "./BriefingCard";

export default async function BriefingsPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const { data: briefings } = await db
    .from("briefings_seo")
    .select("id, termo_id, briefing_jsonb, criado_em, termos(keyword, intencao, cluster, status)")
    .order("criado_em", { ascending: false })
    .limit(200);

  // Quais briefings já têm página criada?
  const termoIds = [...new Set((briefings ?? []).map((b) => b.termo_id).filter(Boolean))];
  const { data: paginasExist } = await db
    .from("paginas")
    .select("termo_id, slug, status")
    .in("termo_id", termoIds);

  const paginaByTermo: Record<string, { slug: string; status: string }> = {};
  for (const p of paginasExist ?? []) {
    if (p.termo_id) paginaByTermo[p.termo_id] = { slug: p.slug, status: p.status };
  }

  const sem_pagina = (briefings ?? []).filter((b) => !paginaByTermo[b.termo_id!]);
  const com_pagina = (briefings ?? []).filter((b) => paginaByTermo[b.termo_id!]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Briefing</h1>
          <p className="text-slate-400 text-sm mt-1">
            Roteiro SEO de cada palavra-chave (o que a página deve cobrir no Google).{" "}
            {sem_pagina.length} aguardando página · {com_pagina.length} já publicados ou em rascunho
          </p>
        </div>
        <Link href="/admin/research" className="text-xs text-slate-400 hover:text-slate-200">
          ← Visão geral
        </Link>
      </div>

      {/* Briefings sem página */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          Aguardando criação ({sem_pagina.length})
        </h2>
        {sem_pagina.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 text-center text-slate-500 text-sm">
            Todos os roteiros já têm página associada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sem_pagina.map((b) => {
              const t = Array.isArray(b.termos) ? b.termos[0] : b.termos;
              const bj = (b.briefing_jsonb ?? {}) as Record<string, unknown>;
              const kw = (t as { keyword?: string } | null)?.keyword;
              return (
                <BriefingCard
                  key={b.id}
                  id={b.id}
                  titulo={briefingPageTitle(bj, kw)}
                  descricao={(bj.meta_description as string) ?? ""}
                  topicos={briefingTopicosStrings(bj)}
                  lsi={briefingLsiStrings(bj)}
                  keyword={(t as { keyword?: string })?.keyword}
                  intencao={(t as { intencao?: string })?.intencao}
                  cluster={(t as { cluster?: string })?.cluster}
                  termoId={b.termo_id!}
                  criadoEm={b.criado_em}
                  pagina={undefined}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Briefings com página */}
      {com_pagina.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Com página criada ({com_pagina.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {com_pagina.map((b) => {
              const t = Array.isArray(b.termos) ? b.termos[0] : b.termos;
              const bj = (b.briefing_jsonb ?? {}) as Record<string, unknown>;
              const pagina = paginaByTermo[b.termo_id!];
              const kw = (t as { keyword?: string } | null)?.keyword;
              return (
                <BriefingCard
                  key={b.id}
                  id={b.id}
                  titulo={briefingPageTitle(bj, kw)}
                  descricao={(bj.meta_description as string) ?? ""}
                  topicos={briefingTopicosStrings(bj)}
                  lsi={briefingLsiStrings(bj)}
                  keyword={(t as { keyword?: string })?.keyword}
                  intencao={(t as { intencao?: string })?.intencao}
                  cluster={(t as { cluster?: string })?.cluster}
                  termoId={b.termo_id!}
                  criadoEm={b.criado_em}
                  pagina={pagina}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

