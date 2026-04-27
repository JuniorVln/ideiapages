import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";

export default async function AdminLeadsPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const { count: total } = await db.from("leads").select("*", { count: "exact", head: true });

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { count: last7 } = await db
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("criado_em", since.toISOString());

  return (
    <div className="space-y-8 max-w-2xl">
      <p>
        <Link href="/admin/dashboard" className="text-sm text-blue-400 hover:underline">
          ← Dashboard
        </Link>
      </p>
      <div>
        <h1 className="text-2xl font-bold text-white">Contatos capturados</h1>
        <p className="text-slate-400 text-sm mt-2">
          Leads enviados pelos formulários das páginas públicas. Para análise em planilha, use a
          exportação (dados sensíveis com opção pseudonimizada).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-semibold text-white mt-1">{total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Últimos 7 dias</p>
          <p className="text-2xl font-semibold text-white mt-1">{last7 ?? 0}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <p className="text-sm text-slate-300 font-medium">Exportar</p>
        <p className="text-sm text-slate-500">
          Inclui páginas, variações, métricas e leads. Na opção de leads, e-mail/telefone vêm
          protegidos (conforme descrição na tela de exportação).
        </p>
        <Link
          href="/admin/export"
          className="inline-flex rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2"
        >
          Abrir exportação CSV
        </Link>
      </div>
    </div>
  );
}
