import { requireAdmin } from "@/lib/admin/require-admin";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin/admin-nav";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Route } from "next";
import { HubSearch } from "./HubSearch";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Zap, 
  Settings, 
  Users, 
  BarChart3, 
  Sparkles,
  ArrowRight,
  History,
  type LucideIcon,
} from "lucide-react";

export default async function AdminHubPage() {
  await requireAdmin();
  const db = getSupabaseAdminOptional();

  let paginas: {
    slug: string;
    titulo: string;
    status: string;
    status_experimento: string | null;
  }[] = [];
  let experimentos: { id: string; status: string; iniciado_em: string | null; pagina_id: string | null }[] = [];
  const slugByPagina: Record<string, string> = {};

  if (db) {
    const pRes = await db
      .from("paginas")
      .select("slug, titulo, status, status_experimento")
      .order("atualizado_em", { ascending: false })
      .limit(10);
    paginas = (pRes.data ?? []) as typeof paginas;

    const eRes = await db
      .from("experimentos")
      .select("id, status, iniciado_em, pagina_id")
      .order("iniciado_em", { ascending: false })
      .limit(5);
    experimentos = (eRes.data ?? []) as typeof experimentos;

    const paginaIds = [...new Set(experimentos.map((e) => e.pagina_id).filter(Boolean))] as string[];
    if (paginaIds.length > 0) {
      const { data: paginasExp } = await db.from("paginas").select("id, slug, titulo").in("id", paginaIds);
      for (const p of paginasExp ?? []) slugByPagina[p.id] = p.slug;
    }
  }

  const sectionIcons: Record<string, LucideIcon> = {
    "Dashboard": LayoutDashboard,
    "Pesquisa": Search,
    "Conteúdo": FileText,
    "Otimização": Zap,
    "Contatos": Users,
    "Config": Settings,
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header com Aura Visual */}
      <header className="relative py-6">
        <div className="absolute -left-10 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Bem-vindo ao centro de comando do <span className="text-blue-400 font-semibold">IdeiaPages</span>. 
            Gerencie sua pesquisa, crie páginas com IA e monitore performance em um só lugar.
          </p>
        </div>
      </header>

      {/* Busca Premium */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative">
          <HubSearch
            staticEntries={ADMIN_NAV_SECTIONS.flatMap((s) =>
              s.items.map((i) => ({
                href: i.href,
                label: i.label,
                section: s.title || "Início",
              })),
            )}
            pages={(paginas ?? []).map((p) => ({
              href: `/admin/pages/${p.slug}`,
              label: p.titulo,
              slug: p.slug,
              status: p.status,
              experimento: p.status_experimento,
            }))}
            experiments={(experimentos ?? []).map((e) => ({
              href: `/admin/experiments/${e.id}`,
              label: slugByPagina[e.pagina_id!]
                ? `Exp. · ${slugByPagina[e.pagina_id!]}`
                : `Experimento ${e.id.slice(0, 8)}…`,
              status: e.status,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Navegação por Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Ferramentas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADMIN_NAV_SECTIONS.map((sec, idx) => {
              const Icon = sectionIcons[sec.title || ""] || Sparkles;
              return (
                <div
                  key={sec.title || `nav-${idx}`}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-800/60 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="w-24 h-24 rotate-12" />
                  </div>
                  
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-1">{sec.title || "Acesso Rápido"}</h3>
                    <ul className="space-y-3 mt-4">
                      {sec.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href as Route}
                            className="flex items-center justify-between group/link text-slate-400 hover:text-white transition-colors"
                          >
                            <span className="text-sm font-medium">{item.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Atividade Recente */}
        <div className="space-y-8">
          {/* Páginas Recentes */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <History className="w-4 h-4" />
              Recentes
            </h2>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/50">
              {paginas.length > 0 ? (
                paginas.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/admin/pages/${p.slug}` as Route}
                    className="block p-4 hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{p.titulo}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">/{p.slug}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                        p.status === 'publicado' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-10 text-center">
                  <p className="text-xs text-slate-600 italic">Nenhuma página criada ainda.</p>
                </div>
              )}
            </div>
            <Link 
              href="/admin/pages" 
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-400 transition-colors ml-1"
            >
              Ver todas as páginas
              <ArrowRight className="w-3 h-3" />
            </Link>
          </section>

          {/* Experimentos */}
          {experimentos.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Experimentos A/B
              </h2>
              <div className="space-y-2">
                {experimentos.map((e) => (
                  <Link
                    key={e.id}
                    href={`/admin/experiments/${e.id}` as Route}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-blue-500/30 hover:bg-slate-800/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        {slugByPagina[e.pagina_id!] ?? `Experimento ${e.id.slice(0, 4)}`}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">{e.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

