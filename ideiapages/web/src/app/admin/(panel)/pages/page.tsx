import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import Link from "next/link";
import { DeletePageButton } from "./DeletePageButton";

export default async function AdminPagesIndex() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const { data: paginas } = await db
    .from("paginas")
    .select(
      "id, slug, titulo, status, status_experimento, termo_id, variacao_vencedora_id, criado_em",
    )
    .order("atualizado_em", { ascending: false })
    .limit(100);

  const { data: counts } = await db.from("variacoes").select("pagina_id");

  const nVar: Record<string, number> = {};
  for (const row of counts ?? []) {
    nVar[row.pagina_id] = (nVar[row.pagina_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Todas as páginas</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Experimento</th>
              <th className="px-4 py-3">Variações</th>
              <th className="px-3 py-3 w-0 whitespace-nowrap">Pública</th>
              <th className="px-3 py-3 w-0"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/50">
            {(paginas ?? []).map((p) => (
              <tr key={p.id} className="text-slate-200">
                <td className="px-4 py-2">
                  <Link href={`/admin/pages/${p.slug}`} className="text-blue-400 hover:underline">
                    {p.slug}
                  </Link>
                </td>
                <td className="px-4 py-2 max-w-xs truncate">{p.titulo}</td>
                <td className="px-4 py-2">{p.status}</td>
                <td className="px-4 py-2">{p.status_experimento ?? "—"}</td>
                <td className="px-4 py-2">{nVar[p.id] ?? 0}</td>
                <td className="px-3 py-2 whitespace-nowrap align-middle">
                  {p.status === "publicado" ? (
                    <a
                      href={`${PUBLIC_CONTENT_BASE_PATH}/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir página pública num novo separador"
                      className="inline-flex items-center rounded-md border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-100 whitespace-nowrap hover:bg-slate-700 hover:border-slate-500"
                    >
                      Ver página
                    </a>
                  ) : (
                    <span className="text-slate-600 text-xs" title="Só disponível com status publicado">
                      —
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap align-middle">
                  <DeletePageButton slug={p.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
