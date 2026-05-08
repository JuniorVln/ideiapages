import { requireAdmin } from "@/lib/admin/require-admin";
import { 
  Search, 
  FileText, 
  Zap, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Trash2,
  Layers,
  MousePointerClick,
  BarChart4,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default async function DossiePage() {
  await requireAdmin();

  const statusResearch = [
    { 
      id: "coletado", 
      label: "Coletado", 
      icon: Clock, 
      color: "text-slate-400", 
      bg: "bg-slate-400/10",
      description: "A palavra-chave foi descoberta e salva. Aguarda classificação de intenção e score." 
    },
    { 
      id: "analisado", 
      label: "Analisado", 
      icon: Search, 
      color: "text-amber-400", 
      bg: "bg-amber-400/10",
      description: "A IA classificou a intenção (transacional, etc) e atribuiu um score de conversão (0-10)." 
    },
    { 
      id: "priorizado", 
      label: "Priorizado", 
      icon: ShieldCheck, 
      color: "text-violet-400", 
      bg: "bg-violet-400/10",
      description: "Termo selecionado para avançar no pipeline por ter alto potencial de negócio." 
    },
    { 
      id: "snapshot_serp_ok", 
      label: "SERP ok", 
      icon: Layers, 
      color: "text-cyan-400", 
      bg: "bg-cyan-400/10",
      description: "Snapshot dos top 10 resultados do Google capturado para análise de concorrência." 
    },
    { 
      id: "scraped", 
      label: "Scraped", 
      icon: MousePointerClick, 
      color: "text-blue-400", 
      bg: "bg-blue-400/10",
      description: "O conteúdo dos sites concorrentes foi raspado e processado em Markdown." 
    },
    { 
      id: "briefing_pronto", 
      label: "Roteiro pronto", 
      icon: CheckCircle2, 
      color: "text-emerald-400", 
      bg: "bg-emerald-400/10",
      description: "O briefing final de SEO foi gerado, identificando gaps de conteúdo e estrutura." 
    },
    { 
      id: "descartado", 
      label: "Descartado", 
      icon: Trash2, 
      color: "text-red-400", 
      bg: "bg-red-400/10",
      description: "O termo foi removido do fluxo por baixa relevância ou má qualidade." 
    },
  ];

  const statusPages = [
    { label: "Rascunho", description: "Página em criação ou edição. Não visível ao público." },
    { label: "Publicado", description: "Página ativa e acessível via URL pública." },
    { label: "Arquivado", description: "Página desativada mas mantida para histórico de dados." },
  ];

  const statusExperiments = [
    { label: "Agendado", description: "Configurado para iniciar automaticamente em data futura." },
    { label: "Rodando", description: "Coletando dados e distribuindo tráfego entre variações." },
    { label: "Concluído", description: "Finalizado com significância estatística. Vencedora definida." },
    { label: "Interrompido", description: "Parado manualmente antes de atingir a amostra necessária." },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="space-y-4">
        <Link href="/admin/hub" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Hub
        </Link>
        <div className="relative">
          <div className="absolute -left-10 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Dossiê do Sistema</h1>
          <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">
            O glossário oficial de status, processos e fluxos do IdeiaPages. 
            Use este guia para entender como cada termo vira uma página de alta conversão.
          </p>
        </div>
      </header>

      {/* Seção de Pesquisa (Pipeline de Palavras-chave) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Funil de Pesquisa (Palavras-chave)</h2>
            <p className="text-sm text-slate-500">O caminho desde a descoberta até o roteiro final</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusResearch.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 group hover:border-slate-700 transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{s.label}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Cálculo de Score */}
      <section className="space-y-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">O Cálculo do Score (0-10)</h2>
            <p className="text-sm text-slate-500">Como a IA avalia o potencial de conversão de cada palavra-chave</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fator 01</div>
            <h3 className="text-lg font-bold text-white">Intenção de Busca</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              O fator de maior peso. A IA analisa se o usuário quer apenas informação (&quot;o que é...&quot;) ou se quer contratar (&quot;preço...&quot;, &quot;comprar...&quot;).
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fator 02</div>
            <h3 className="text-lg font-bold text-white">Aderência ao Produto</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Avalia o quanto o termo resolve um problema que o Ideia Chat (WhatsApp Multi-atendimento) soluciona diretamente.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fator 03</div>
            <h3 className="text-lg font-bold text-white">Etapa da Jornada</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Identifica se o usuário está na fase de descoberta (Topo), consideração (Meio) ou decisão de compra (Fundo).
            </p>
          </div>
        </div>

        <div className="p-1 rounded-3xl bg-slate-800/30 border border-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 overflow-hidden rounded-[22px]">
            <div className="p-8 rounded-[22px] bg-slate-900/40 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-slate-600">0-3</span>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase tracking-tighter">Topo de Funil</span>
              </div>
              <h4 className="font-bold text-white">Baixa Conversão</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Termos genéricos, definições e curiosidades. Grande volume de buscas, mas baixa intenção de contratação imediata.
              </p>
            </div>
            <div className="p-8 rounded-[22px] bg-slate-900/40 space-y-4 border-x border-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-blue-500">4-6</span>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-tighter">Meio de Funil</span>
              </div>
              <h4 className="font-bold text-white">Média Conversão</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Usuário comparando soluções ou buscando resolver um problema específico de atendimento que o software atende.
              </p>
            </div>
            <div className="p-8 rounded-[22px] bg-slate-900/40 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-emerald-500">7-10</span>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-tighter">Fundo de Funil</span>
              </div>
              <h4 className="font-bold text-white">Alta Conversão</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Termos transacionais, busca por preços, integrações ou termos de concorrentes diretos. Máxima intenção comercial.
              </p>
            </div>
          </div>
        </div>
      </section>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Status de Páginas */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Status de Páginas</h2>
          </div>
          <div className="space-y-3">
            {statusPages.map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/20">
                <p className="text-sm font-bold text-slate-200">{s.label}</p>
                <p className="text-xs text-slate-500 mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Status de Experimentos */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <BarChart4 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Status de Experimentos</h2>
          </div>
          <div className="space-y-3">
            {statusExperiments.map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/20">
                <p className="text-sm font-bold text-slate-200">{s.label}</p>
                <p className="text-xs text-slate-500 mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Dica de Especialista */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 relative overflow-hidden">
        <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/5 rotate-12" />
        <div className="flex items-start gap-4 relative">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-white">Dica de Conversão</h3>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              O pipeline de pesquisa prioriza automaticamente termos com alto **Intenção Transacional**. 
              Isso garante que as páginas geradas atraiam usuários prontos para contratar o serviço, 
              maximizando o retorno sobre o custo das APIs de IA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
