"use client";

import {
  FileText,
  Target,
  Zap,
  Clock,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function BriefingCard({
  id,
  titulo,
  descricao,
  topicos,
  lsi,
  keyword,
  intencao,
  cluster,
  termoId,
  criadoEm,
  pagina,
}: {
  id: string;
  titulo: string;
  descricao: string;
  topicos: unknown;
  lsi?: string[];
  keyword?: string;
  intencao?: string;
  cluster?: string;
  termoId: string;
  criadoEm: string | null;
  pagina?: { slug: string; status: string };
}) {
  const topicosArr: string[] = Array.isArray(topicos) ? (topicos as string[]) : [];
  const lsiArr = lsi ?? [];
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar este briefing? Isso não afetará a página caso ela já exista.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/research/briefings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Erro ao deletar briefing.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao deletar briefing.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={`group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4 transition-all hover:bg-slate-800/60 hover:border-slate-700/50 hover:shadow-xl hover:shadow-blue-900/5 overflow-hidden ${isDeleting ? "opacity-50 grayscale pointer-events-none" : ""}`}>
      {/* Indicador de Status Visual */}
      <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 transition-colors ${pagina ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`} />
      
      <div className="relative flex flex-wrap gap-1.5">
        {keyword && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold tracking-wider">
            {keyword}
          </span>
        )}
        {intencao && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase font-bold tracking-wider">
            {intencao}
          </span>
        )}
        {cluster && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50 uppercase font-bold tracking-wider">
            {cluster}
          </span>
        )}
      </div>

      <div className="relative">
        <h3 className="font-bold text-white leading-tight group-hover:text-blue-200 transition-colors">{titulo}</h3>
        {descricao && (
          <p className="text-sm text-slate-400 mt-2 leading-relaxed line-clamp-2 italic">
            "{descricao}"
          </p>
        )}
      </div>

      <div className="relative grid grid-cols-2 gap-4">
        {topicosArr.length > 0 && (
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Tópicos
            </p>
            <div className="flex flex-wrap gap-1">
              {topicosArr.slice(0, 3).map((t, i) => (
                <span key={i} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700/30">
                  {t}
                </span>
              ))}
              {topicosArr.length > 3 && (
                <span className="text-[10px] text-slate-600">+{topicosArr.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {lsiArr.length > 0 && (
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              LSI
            </p>
            <div className="flex flex-wrap gap-1">
              {lsiArr.slice(0, 4).map((t, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-emerald-950/30 text-emerald-400/80 px-1.5 py-0.5 rounded border border-emerald-800/30"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/research/terms/${termoId}`}
            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-all"
            title="Ver Termo"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
            title="Deletar Briefing"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex flex-col ml-1">
            <span className="text-[10px] text-slate-600 uppercase tracking-tighter flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {criadoEm ? new Date(criadoEm).toLocaleDateString("pt-BR") : "—"}
            </span>
          </div>
        </div>
        
        {pagina ? (
          <Link
            href={`/admin/pages/${pagina.slug}`}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ver Página
          </Link>
        ) : (
          <Link
            href={`/admin/pages/new?briefing_id=${id}`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Criar Página
          </Link>
        )}
      </div>
    </div>
  );
}
