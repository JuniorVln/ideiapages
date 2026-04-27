import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { briefingPageTitle } from "@/lib/research/briefing-json";
import Link from "next/link";
import { NewPageForm } from "./NewPageForm";

interface SearchParams {
  briefing_id?: string;
}

export default async function NewPagePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  // Se veio com briefing_id, pré-carrega o briefing
  let briefing: {
    id: string;
    titulo_sugerido?: string | null;
    meta_description?: string | null;
    keyword: string;
    intencao?: string | null;
  } | null = null;

  if (sp.briefing_id) {
    const { data } = await db
      .from("briefings_seo")
      .select("id, briefing_jsonb, termos(keyword, intencao)")
      .eq("id", sp.briefing_id)
      .single();
    if (data) {
      const t = Array.isArray(data.termos) ? data.termos[0] : data.termos;
      const bj = (data.briefing_jsonb ?? {}) as Record<string, unknown>;
      briefing = {
        id: data.id,
        titulo_sugerido: (() => {
          const title = briefingPageTitle(bj, (t as { keyword: string } | null)?.keyword);
          return title === "Sem título" ? null : title;
        })(),
        meta_description: (bj.meta_description as string) ?? null,
        keyword: (t as { keyword: string })?.keyword ?? "",
        intencao: (t as { intencao?: string })?.intencao,
      };
    }
  }

  // Lista briefings disponíveis (sem página criada) para seleção
  const { data: briefingsSemPagina } = await db
    .from("briefings_seo")
    .select("id, briefing_jsonb, termos!inner(keyword, status)")
    .eq("termos.status", "briefing_pronto")
    .order("criado_em", { ascending: false })
    .limit(100);

  // Filtra os que já têm página
  const termoIds = (briefingsSemPagina ?? [])
    .map((b) => {
      const t = Array.isArray(b.termos) ? b.termos[0] : b.termos;
      return (t as { keyword: string } | null)?.keyword;
    })
    .filter(Boolean);

  const briefingsOptions = (briefingsSemPagina ?? []).map((b) => {
    const t = Array.isArray(b.termos) ? b.termos[0] : b.termos;
    const bj = (b.briefing_jsonb ?? {}) as Record<string, unknown>;
    const titulo = briefingPageTitle(bj, (t as { keyword: string })?.keyword) ?? b.id;
    return {
      id: b.id,
      label: titulo,
      keyword: (t as { keyword: string })?.keyword ?? "",
    };
  });

  void termoIds;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/pages" className="hover:text-slate-300">
          Todas as páginas
        </Link>
        <span>/</span>
        <span className="text-slate-300">Gerar página</span>
      </div>

      <h1 className="text-2xl font-bold text-white">Gerar página a partir do roteiro</h1>

      {briefing && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
          <p className="text-blue-300 font-medium">Roteiro selecionado</p>
          <p className="text-slate-300 mt-1">
            <span className="font-mono text-blue-400">{briefing.keyword}</span>
            {briefing.intencao && <span className="text-slate-500"> · {briefing.intencao}</span>}
          </p>
          {briefing.titulo_sugerido && (
            <p className="text-slate-400 mt-0.5 text-xs">{briefing.titulo_sugerido}</p>
          )}
        </div>
      )}

      <NewPageForm
        preselectedBriefingId={briefing?.id ?? null}
        briefingsOptions={briefingsOptions}
      />

      <div className="border-t border-slate-800 pt-4 text-xs text-slate-500">
        <p>
          A página será criada a partir do briefing SEO. O conteúdo MDX é gerado automaticamente
          a partir dos tópicos do briefing.
        </p>
        <p className="mt-1">
          Para gerar variações A/B com IA, use{" "}
          <span className="text-slate-400">Páginas → [slug] → Gerar variações</span> após criar.
        </p>
      </div>
    </div>
  );
}
