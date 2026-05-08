import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { AdminNeedSupabaseEnv } from "@/components/AdminNeedSupabaseEnv";
import {
  Users,
  ArrowLeft,
  Download,
  Calendar,
  Mail,
  Phone,
  User,
  ExternalLink,
  History,
  Zap,
} from "lucide-react";

type LeadListRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criado_em: string;
  paginas: { titulo: string; slug: string } | null;
};

export default async function AdminLeadsPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();
  if (!db) return <AdminNeedSupabaseEnv />;

  const [
    { count: total },
    { count: last7 },
    { data: leads }
  ] = await Promise.all([
    db.from("leads").select("*", { count: "exact", head: true }),
    db.from("leads")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    db.from("leads")
      .select(`
        id,
        nome,
        email,
        telefone,
        criado_em,
        paginas (
          titulo,
          slug
        )
      `)
      .order("criado_em", { ascending: false })
      .limit(50)
  ]);

  const leadRows: LeadListRow[] = (leads ?? []) as LeadListRow[];

  const formatDate = (iso: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Contatos capturados
          </h1>
          <p className="text-slate-400 text-sm">
            Visualize e gerencie os leads gerados pelas suas páginas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/export"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 transition-all shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/60 overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold">Total Geral</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tight">{total ?? 0}</p>
        </div>
        <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/60 overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-24 h-24" />
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold">Últimos 7 dias</p>
          <p className="text-4xl font-black text-blue-400 mt-2 tracking-tight">+{last7 ?? 0}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Leads Recentes
          </h2>
          <span className="text-xs text-slate-500 italic">Mostrando os últimos 50</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contato</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Origem</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {leadRows.length > 0 ? (
                  leadRows.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-white">{lead.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          {lead.telefone}
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.paginas ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-slate-300 truncate max-w-[150px]">
                              {lead.paginas.titulo}
                            </p>
                            <Link 
                              href={`/admin/pages/${lead.paginas.slug}`}
                              className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                            >
                              Ver página
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lead.criado_em)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-600 italic text-sm">
                      Nenhum contato capturado até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
