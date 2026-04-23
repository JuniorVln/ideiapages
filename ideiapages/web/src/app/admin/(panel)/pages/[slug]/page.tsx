import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminPageDetail({ params }: Props) {
  await requireAdmin();
  const { slug } = await params;
  const db = getSupabaseAdmin();

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

  return (
    <div className="space-y-6">
      <p>
        <Link href="/admin/pages" className="text-sm text-blue-400 hover:underline">
          ← Páginas
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-white">{pagina.titulo}</h1>
      <p className="text-slate-400 text-sm">
        /blog/{slug} · status {pagina.status} · experimento{" "}
        {pagina.status_experimento ?? "—"} · leads totais {nLeads ?? 0}
      </p>
      <section className="rounded-xl border border-slate-800 overflow-hidden">
        <h2 className="text-lg font-semibold text-white px-4 py-3 bg-slate-900">Variações</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-400 bg-slate-900/80">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Provider</th>
              <th className="text-left px-4 py-2">Ativa</th>
              <th className="text-left px-4 py-2">Modelo</th>
              <th className="text-left px-4 py-2">Custo USD (est.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {(variacoes ?? []).map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 font-mono text-xs">{v.nome}</td>
                <td className="px-4 py-2">{v.provider}</td>
                <td className="px-4 py-2">{v.ativa ? "sim" : "não"}</td>
                <td className="px-4 py-2 text-xs">{v.model_version ?? "—"}</td>
                <td className="px-4 py-2">
                  {v.custo_estimado_usd != null ? v.custo_estimado_usd.toFixed(4) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <a
        href={`/blog/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-blue-400 hover:underline text-sm"
      >
        Abrir página pública ↗
      </a>
    </div>
  );
}
