import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateForm } from "./GenerateForm";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;
  const { slug } = await params;

  const { data: pagina } = await db
    .from("paginas")
    .select("id, slug, titulo, status, status_experimento, termo_id")
    .eq("slug", slug)
    .single();

  if (!pagina) notFound();

  const { data: variacoes } = await db
    .from("variacoes")
    .select("id, nome, provider, ativa, model_version, custo_estimado_usd, criado_em")
    .eq("pagina_id", pagina.id)
    .order("criado_em", { ascending: true });

  const { data: termo } = await db
    .from("termos")
    .select("id, keyword, intencao")
    .eq("id", pagina.termo_id!)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/pages" className="hover:text-slate-300">
          Páginas
        </Link>
        <span>/</span>
        <Link href={`/admin/pages/${slug}`} className="hover:text-slate-300">
          {slug}
        </Link>
        <span>/</span>
        <span className="text-slate-300">Gerar variações</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Gerar variações A/B</h1>
        <p className="text-slate-400 text-sm mt-1">
          {pagina.titulo}
          {termo && (
            <span className="ml-2 text-slate-500">
              · <span className="text-slate-400">{termo.keyword}</span>
              {termo.intencao && ` · ${termo.intencao}`}
            </span>
          )}
        </p>
      </div>

      {/* Variações existentes */}
      {(variacoes ?? []).length > 0 && (
        <section className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300">
            Variações existentes ({variacoes!.length})
          </div>
          <table className="w-full text-sm">
            <thead className="text-slate-400 bg-slate-900/60">
              <tr>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-left px-4 py-2">Provider</th>
                <th className="text-left px-4 py-2">Ativa</th>
                <th className="text-right px-4 py-2">Custo USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {variacoes!.map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-2 font-mono text-xs">{v.nome}</td>
                  <td className="px-4 py-2">
                    <ProviderBadge provider={v.provider ?? ""} />
                  </td>
                  <td className="px-4 py-2">
                    {v.ativa ? (
                      <span className="text-emerald-400 text-xs">✓ ativa</span>
                    ) : (
                      <span className="text-slate-600 text-xs">inativa</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-slate-400">
                    {v.custo_estimado_usd != null ? `$${v.custo_estimado_usd.toFixed(4)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Aviso de status */}
      {pagina.status === "rascunho" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <strong>Atenção:</strong> A página está em <strong>rascunho</strong>. As variações serão
          geradas mas o experimento A/B só será visível quando a página for publicada.
        </div>
      )}

      {/* Formulário */}
      <GenerateForm paginaId={pagina.id} slug={slug} />
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    claude: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    gpt: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    gemini: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    manual: "bg-slate-600/40 text-slate-300 border-slate-600",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[provider] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
    >
      {provider}
    </span>
  );
}
