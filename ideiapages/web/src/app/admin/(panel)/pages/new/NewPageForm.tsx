"use client";

import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles, FileText, CheckCircle2, ChevronRight, Info, AlertCircle, Layout, Target } from "lucide-react";

interface BriefingOption {
  id: string;
  label: string;
  keyword: string;
}

/** Campos usados no preview (briefing SEO JSON). */
type BriefingJsonPreview = {
  title_seo?: string;
  meta_description?: string;
  gancho_vendas?: string;
  estrutura_h2_h3?: { h2?: string; h3s?: string[] }[];
  information_gain?: { topicos_unicos_que_concorrentes_nao_tem?: string[] };
  gaps_conteudo_top3?: string;
  word_count_alvo?: string | number;
  tom_de_voz?: string;
};

interface BriefingData {
  id: string;
  briefing_jsonb: Record<string, unknown>;
  termos: {
    keyword: string;
    intencao?: string;
    cluster?: string;
  };
}

export function NewPageForm({
  preselectedBriefingId,
  briefingsOptions,
}: {
  preselectedBriefingId: string | null;
  briefingsOptions: BriefingOption[];
}) {
  const router = useRouter();
  const [briefingId, setBriefingId] = useState(preselectedBriefingId ?? "");
  const [publish, setPublish] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  useEffect(() => {
    if (briefingId) {
      loadBriefingData(briefingId);
    } else {
      setBriefingData(null);
    }
  }, [briefingId]);

  async function loadBriefingData(id: string) {
    setLoadingBriefing(true);
    try {
      const res = await fetch(`/api/admin/research/briefings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBriefingData(data);
      }
    } catch (e) {
      console.error("Erro ao carregar briefing:", e);
    } finally {
      setLoadingBriefing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!briefingId) {
      setError("Selecione um briefing.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        briefing_id: briefingId, 
        publish,
        refine_with_ai: useAI 
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        setError(`Página já existe. Slug: ${PUBLIC_CONTENT_BASE_PATH}/${data.slug}`);
      } else {
        setError(data.error ?? "Erro ao criar página.");
      }
      setLoading(false);
      return;
    }

    router.push(`/admin/pages/${data.slug}`);
  }

  const bj = briefingData?.briefing_jsonb as BriefingJsonPreview | undefined;
  const kw = briefingData?.termos?.keyword;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {/* Coluna de Configuração */}
      <div className="xl:col-span-2 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-400" />
            Configurações da Página
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de briefing */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Roteiro SEO (Briefing)</label>
              {preselectedBriefingId ? (
                <div className="px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-100 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Roteiro selecionado</span>
                  </div>
                  <span className="font-mono text-xs opacity-60">{preselectedBriefingId.slice(0, 8)}...</span>
                </div>
              ) : (
                <select
                  value={briefingId}
                  onChange={(e) => setBriefingId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer hover:bg-slate-800"
                  required
                >
                  <option value="">Selecione um briefing...</option>
                  {briefingsOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.keyword} — {b.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Expansão com IA */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-200">Refinar com IA</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseAI(!useAI)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useAI ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useAI ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A IA escreverá textos completos e persuasivos baseados nos tópicos do roteiro, em vez de apenas listar os itens.
              </p>
            </div>

            {/* Status inicial */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Status de Lançamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPublish(false)}
                  className={`px-4 py-3 rounded-xl border transition-all text-left flex flex-col gap-1 ${!publish ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'}`}
                >
                  <span className={`text-sm font-medium ${!publish ? 'text-blue-200' : 'text-slate-300'}`}>Rascunho</span>
                  <span className="text-[10px] text-slate-500">Privado no admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPublish(true)}
                  className={`px-4 py-3 rounded-xl border transition-all text-left flex flex-col gap-1 ${publish ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'}`}
                >
                  <span className={`text-sm font-medium ${publish ? 'text-emerald-200' : 'text-slate-300'}`}>Publicado</span>
                  <span className="text-[10px] text-slate-500">Visível no site</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || (!briefingId && !preselectedBriefingId)}
                className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Criando página...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Gerar Página Agora
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-900/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Ao criar a página, os metadados (Title, Description) e a estrutura de headings (H2/H3) serão gerados automaticamente para maximizar o ranqueamento no Google.
          </p>
        </div>
      </div>

      {/* Coluna de Preview Visual */}
      <div className="xl:col-span-3">
        <div className="sticky top-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" />
              Preview do Roteiro SEO
            </h3>
            {loadingBriefing && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                Carregando...
              </div>
            )}
          </div>

          {!briefingId ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/20 aspect-[16/10] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-600" />
              </div>
              <h4 className="text-slate-300 font-medium mb-1">Nenhum roteiro selecionado</h4>
              <p className="text-slate-500 text-sm max-w-xs">
                Selecione um briefing à esquerda para visualizar a estrutura estratégica da página.
              </p>
            </div>
          ) : bj ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl flex flex-col max-h-[750px]">
              {/* Header do Preview */}
              <div className="bg-slate-800/50 border-b border-slate-700/50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold tracking-widest">
                    {kw || "Keyword"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 uppercase font-bold tracking-widest">
                    {briefingData?.termos?.intencao || "Briefing"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-tight mb-2">
                  {bj.title_seo || "Título SEO pendente"}
                </h2>
                <p className="text-sm text-slate-400 line-clamp-2 italic">
                  &ldquo;{bj.meta_description || "Sem descrição disponível..."}&rdquo;
                </p>
              </div>

              {/* Corpo do Preview */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Gancho */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-4 h-px bg-blue-400/30" />
                    Gancho de Abertura (Hook)
                  </h4>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-slate-300 text-sm leading-relaxed border-l-2 border-l-blue-500">
                    {bj.gancho_vendas}
                  </div>
                </div>

                {/* Estrutura H2/H3 */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-4 h-px bg-emerald-400/30" />
                    Arquitetura de Headings
                  </h4>
                  <div className="space-y-4">
                    {Array.isArray(bj.estrutura_h2_h3) &&
                      bj.estrutura_h2_h3.map((block, i: number) => (
                      <div key={i} className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-mono text-slate-600 mt-1">H2</span>
                          <h5 className="text-slate-200 font-semibold">{block.h2}</h5>
                        </div>
                        {Array.isArray(block.h3s) && block.h3s.length > 0 && (
                          <div className="mt-3 ml-8 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {block.h3s.map((h3: string, j: number) => (
                              <div key={j} className="flex items-center gap-2 text-xs text-slate-400">
                                <ChevronRight className="w-3 h-3 text-emerald-500/50" />
                                <span>{h3}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps e Diferenciais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">Conteúdo Único</h4>
                    <ul className="space-y-2">
                      {bj.information_gain?.topicos_unicos_que_concorrentes_nao_tem?.map((t: string, i: number) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Oportunidade (Gaps)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      {bj.gaps_conteudo_top3}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer do Preview */}
              <div className="bg-slate-800/80 border-t border-slate-700/50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Palavras</div>
                    <div className="text-sm font-mono text-slate-300">{bj.word_count_alvo || "—"}</div>
                  </div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Tom</div>
                    <div className="text-sm text-slate-300 capitalize">{bj.tom_de_voz?.split(',')[0] || "Direto"}</div>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border border-slate-800 bg-slate-700 flex items-center justify-center">
                      <Layout className="w-3 h-3 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 aspect-[16/10] flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <h4 className="text-slate-300 font-medium">Processando estrutura...</h4>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.5);
        }
      `}</style>
    </div>
  );
}

