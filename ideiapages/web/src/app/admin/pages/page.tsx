import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminPagesIndex() {
  await requireAdmin();
  const db = getSupabaseAdmin();

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
      <h1 className="text-2xl font-bold text-white">Páginas</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Experimento</th>
              <th className="px-4 py-3">Variações</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
