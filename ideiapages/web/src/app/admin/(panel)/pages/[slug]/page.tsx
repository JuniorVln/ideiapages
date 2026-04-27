import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishPageBar } from "./PublishPageBar";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminPageDetail({ params }: Props) {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;
  const { slug } = await params;

  const { data: pagina, error } = await db
    .from("paginas")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !pagina) notFound();

  const { data: variacoes } = await db
    .from("variacoes")
    .select("id, nome, provider, ativa, prompt_version, model_version, custo_estimado_usd, criado_em")
    .eq("pagina_id", pagina.id)
    .order("criado_em", { ascending: true });

  const { count: nLeads } = await db
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("pagina_id", pagina.id);

  const isPublic = pagina.status === "publicado";

  return (
    <div className="space-y-6">
      {/* Breadcrumb + ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/pages" className="text-sm text-blue-400 hover:underline">
          ← Todas as páginas
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/admin/pages/${slug}/generate`}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Gerar variações A/B
          </Link>
          {isPublic ? (
            <a
              href={`${PUBLIC_CONTENT_BASE_PATH}/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
            >
              Abrir página pública ↗
            </a>
          ) : (
            <span
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-500 text-sm cursor-not-allowed"
              title="Publicar a página abaixo para abrir a URL pública"
            >
              Página pública (404 até publicar)
            </span>
          )}
        </div>
      </div>

      <PublishPageBar slug={slug} status={pagina.status} />

      <div>
        <h1 className="text-2xl font-bold text-white">{pagina.titulo}</h1>
        <p className="text-slate-400 text-sm mt-1">
          <span className="font-mono">
            {PUBLIC_CONTENT_BASE_PATH}/{slug}
          </span>
          <span className="mx-2 text-slate-700">·</span>
          <span>Status: <strong className="text-slate-200">{pagina.status}</strong></span>
          <span className="mx-2 text-slate-700">·</span>
          <span>Experimento: <strong className="text-slate-200">{pagina.status_experimento ?? "—"}</strong></span>
          <span className="mx-2 text-slate-700">·</span>
          <span>Leads totais: <strong className="text-slate-200">{nLeads ?? 0}</strong></span>
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">
            Variações ({(variacoes ?? []).length})
          </h2>
          <Link
            href={`/admin/pages/${slug}/generate`}
            className="text-xs text-blue-400 hover:underline"
          >
            + Gerar nova
          </Link>
        </div>
        {(variacoes ?? []).length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            Nenhuma variação gerada ainda.{" "}
            <Link href={`/admin/pages/${slug}/generate`} className="text-blue-400 hover:underline">
              Gerar com IA →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-400 bg-slate-900/80">
              <tr>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-left px-4 py-2">Provider</th>
                <th className="text-left px-4 py-2">Ativa</th>
                <th className="text-left px-4 py-2">Modelo</th>
                <th className="text-right px-4 py-2">Custo USD (est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {(variacoes ?? []).map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-2 font-mono text-xs">{v.nome}</td>
                  <td className="px-4 py-2">{v.provider ?? "—"}</td>
                  <td className="px-4 py-2">
                    {v.ativa ? (
                      <span className="text-xs text-emerald-400">✓ ativa</span>
                    ) : (
                      <span className="text-xs text-slate-600">inativa</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-400">{v.model_version ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-slate-400">
                    {v.custo_estimado_usd != null ? `$${v.custo_estimado_usd.toFixed(4)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
