import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import Link from "next/link";
import { DeletePageButton } from "./DeletePageButton";

interface SearchParams {
  q?: string;
  desde?: string;
  ate?: string;
}

export default async function AdminPagesIndex({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const sp = await searchParams;

  let query = db
    .from("paginas")
    .select(
      "id, slug, titulo, status, status_experimento, termo_id, variacao_vencedora_id, criado_em",
    );

  if (sp.q) {
    query = query.or(`slug.ilike.%${sp.q}%,titulo.ilike.%${sp.q}%`);
  }
  if (sp.desde) {
    query = query.gte("criado_em", sp.desde);
  }
  if (sp.ate) {
    query = query.lte("criado_em", `${sp.ate}T23:59:59`);
  }

  const { data: paginas } = await query
    .order("atualizado_em", { ascending: false })
    .limit(200);

  const { data: counts } = await db.from("variacoes").select("pagina_id");

  const nVar: Record<string, number> = {};
  for (const row of counts ?? []) {
    nVar[row.pagina_id] = (nVar[row.pagina_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Todas as páginas</h1>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 items-end bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase font-semibold">Busca</label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Slug ou título..."
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm w-64 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase font-semibold">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={sp.desde ?? ""}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 uppercase font-semibold">Até</label>
          <input
            type="date"
            name="ate"
            defaultValue={sp.ate ?? ""}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Filtrar
          </button>
          {(sp.q || sp.desde || sp.ate) && (
            <Link
              href="/admin/pages"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Experimento</th>
              <th className="px-4 py-3">Variações</th>
              <th className="px-4 py-3">Criado em</th>
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
                <td className="px-4 py-2 text-slate-400 text-xs">
                  {p.criado_em ? new Date(p.criado_em).toLocaleDateString("pt-BR") : "—"}
                </td>
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
