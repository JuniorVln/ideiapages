import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Search, 
  TrendingUp, Activity, CheckCircle2,
  Bot, ChevronRight, ChevronLeft, 
  Zap, 
  Shield, BarChart3, Target, DollarSign,
  Globe, Users, Clock,
  Sparkles, BrainCircuit,
  RefreshCcw, ArrowRight,
  MessageCircle, FormInput, Filter,
  FlaskConical, SplitSquareHorizontal
} from 'lucide-react';

/* ── Motion presets ── */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } }
};

/* ── Reusable mini-components ── */
const Badge = ({ children, color = 'accent' }: { children: React.ReactNode; color?: string }) => (
  <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-${color}-500/15 text-${color}-400 font-bold`}>
    {children}
  </span>
);

const SectionHeader = ({ tag, title }: { tag: string; title: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-accent-400 font-bold uppercase tracking-[0.2em] mb-3 text-[11px]">{tag}</h2>
    <h3 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white leading-tight">{title}</h3>
  </div>
);

/* ════════════════════════════════════════
   SLIDES — IDeiaPages v2
   ════════════════════════════════════════ */

const slides = [
  /* ── 1. CAPA ── */
  {
    id: 'capa', label: 'Capa',
    content: (
      <div className="flex flex-col items-center justify-center min-h-full text-center px-4 sm:px-6 py-6">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full glass text-[10px] font-bold uppercase tracking-[0.2em] text-accent-300 border-accent-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
          </span>
          Proposta Atualizada — 2026
        </motion.div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 text-glow text-white leading-[1.05]">
          <span className="text-gradient">IDeiaPages</span><br/>Páginas que Convertem
        </h1>
        <p className="text-sm md:text-base text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Sistema inteligente de <span className="text-white font-medium">geração de páginas otimizadas para SEO</span> — 
          descobre o que seus clientes pesquisam, cria páginas sob medida e transforma buscas em{' '}
          <span className="text-accent-400 font-semibold">novos clientes</span>.
        </p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 text-xs">
          {[
            { n: 'Qualquer Nicho', t: 'Sistema Flexível' },
            { n: 'Cauda Longa', t: 'Termos Estratégicos' },
            { n: '3 IAs', t: 'Teste A/B Nativo' },
            { n: 'Conversão', t: 'Objetivo Final' },
          ].map((k, i) => (
            <div key={i} className="glass-card px-5 py-3 text-center min-w-[100px]">
              <div className="text-lg font-display font-bold text-accent-400">{k.n}</div>
              <div className="text-muted text-[10px] uppercase tracking-wider mt-0.5">{k.t}</div>
            </div>
          ))}
        </motion.div>
      </div>
    )
  },

  /* ── 2. O QUE MUDOU ── */
  {
    id: 'mudancas', label: 'O que Mudou',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Evolução do Projeto" title={<>De projeto técnico para <span className="text-gradient">estratégia de resultado</span></>} />
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-5 mb-6">
          <motion.div variants={fadeUp} className="glass-card p-6 border-l-2 border-l-red-500/60">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg"><Filter className="text-red-400 w-4 h-4" /></div>
              <h4 className="text-base font-display font-bold text-white">Antes (v1)</h4>
            </div>
            <ul className="space-y-2 text-xs text-muted">
              {[
                'Nicho fixo: Certificado Digital',
                'Premissa de 5.570 municípios',
                'Meta: 33 mil+ páginas (volume)',
                'Foco em infraestrutura técnica',
                'MVP grande e complexo',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span className="line-through opacity-60">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-card p-6 border-l-2 border-l-accent-500 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-accent-500/8 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-2.5 mb-4 relative z-10">
              <div className="p-2 bg-accent-500/10 rounded-lg"><Rocket className="text-accent-400 w-4 h-4" /></div>
              <h4 className="text-base font-display font-bold text-white">Agora (v2)</h4>
            </div>
            <ul className="space-y-2 text-xs text-muted relative z-10">
              {[
                'Sistema genérico — funciona para qualquer nicho',
                'Descobre o que os usuários realmente buscam',
                'Meta: conversão — páginas é consequência',
                'Foco em pesquisa e estratégia de marketing',
                'MVP enxuto com resultado rápido',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />
                  <span className="text-white/90">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-card p-4 border-accent-500/20 bg-accent-500/[0.03]">
          <p className="text-center text-accent-300 text-xs font-medium">
            🎯 <strong>MVP com o Ideia Chat</strong> (ideiamultichat.com.br) — SaaS de atendimento via WhatsApp com 400+ clientes.
            O primeiro nicho validado, mas o sistema serve para qualquer produto.
          </p>
        </motion.div>
      </div>
    )
  },

  /* ── 3. PIPELINE ── */
  {
    id: 'pipeline', label: 'Pipeline',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Como Funciona" title={<>O Pipeline em <span className="text-gradient">3 etapas</span></>} />
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Search className="w-5 h-5 text-cyan-400" />,
              color: 'cyan',
              n: '01',
              title: 'Descobrir',
              sub: 'Pesquisa Aprofundada',
              desc: 'Mapeamento de termos de cauda longa que os usuários pesquisam no nicho. Análise de volume, concorrência e intenção de compra. A pesquisa define quais e quantas páginas criar.',
              items: ['Termos que usuários realmente buscam', 'Análise de concorrência', 'Priorização por potencial de conversão'],
            },
            {
              icon: <FlaskConical className="w-5 h-5 text-purple-400" />,
              color: 'purple',
              n: '02',
              title: 'Criar & Testar',
              sub: 'Geração com A/B Testing',
              desc: 'Cada página é gerada em 2–3 variações por IAs diferentes (Claude, GPT, Gemini). Teste A/B define qual variação converte melhor.',
              items: ['3 IAs gerando variações de copy', 'Teste A/B automático', 'Formulário de captura de leads'],
              highlight: true,
            },
            {
              icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
              color: 'emerald',
              n: '03',
              title: 'Otimizar & Escalar',
              sub: 'Melhoria Contínua',
              desc: 'Monitoramento de posição e conversão. Páginas que perdem ranking são reescritas automaticamente. O que converte, é expandido.',
              items: ['Autocura de páginas em queda', 'Escalar o que converte', 'Loop de otimização infinito'],
            },
          ].map((m, i) => (
            <motion.div key={i} variants={fadeUp}
              className={`glass-card p-5 transition-all duration-300 hover:-translate-y-0.5 ${m.highlight ? 'scale-[1.02] border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.08)]' : ''}`}>
              <div className={`w-10 h-10 rounded-xl bg-${m.color}-500/10 border border-${m.color}-500/20 flex items-center justify-center mb-4`}>
                {m.icon}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold text-${m.color}-400`}>{m.n}</span>
                <h4 className="text-sm font-bold text-white">{m.title}</h4>
              </div>
              <p className={`text-[10px] text-${m.color}-400 font-medium uppercase tracking-wider mb-2`}>{m.sub}</p>
              <p className="text-muted text-xs leading-relaxed mb-3">{m.desc}</p>
              <ul className="space-y-1.5">
                {m.items.map((item, j) => (
                  <li key={j} className={`flex items-start gap-1.5 text-[11px] text-muted`}>
                    <CheckCircle2 className={`w-3 h-3 text-${m.color}-400 mt-0.5 shrink-0`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  },

  /* ── 4. TESTE A/B ── */
  {
    id: 'ab-test', label: 'Teste A/B',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Diferencial Competitivo" title={<>3 IAs competindo pela <span className="text-gradient">melhor conversão</span></>} />
        <p className="text-muted text-sm mb-6 max-w-3xl -mt-4">
          Para cada página, geramos variações de copy com <strong className="text-white">IAs diferentes</strong>. 
          O tráfego é distribuído igualmente e <em className="text-white">os dados decidem</em> qual vence.
        </p>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-3 gap-4 mb-5">
          {[
            { icon: <BrainCircuit className="w-6 h-6 text-purple-400" />, ia: 'Claude', company: 'Anthropic', trait: 'Preciso e factual', color: 'purple', perc: 'Variação A' },
            { icon: <Bot className="w-6 h-6 text-emerald-400" />, ia: 'GPT', company: 'OpenAI', trait: 'Criativo e persuasivo', color: 'emerald', perc: 'Variação B' },
            { icon: <Sparkles className="w-6 h-6 text-blue-400" />, ia: 'Gemini', company: 'Google', trait: 'Dados atualizados', color: 'blue', perc: 'Variação C' },
          ].map((x, i) => (
            <motion.div key={i} variants={fadeUp} className={`glass-card p-5 text-center border-t-2 border-t-${x.color}-500`}>
              <div className="flex justify-center mb-3">{x.icon}</div>
              <h4 className="text-base font-display font-bold text-white mb-0.5">{x.ia}</h4>
              <p className={`text-[10px] text-${x.color}-400 font-medium uppercase tracking-wider mb-2`}>{x.company}</p>
              <p className="text-muted text-xs mb-3">{x.trait}</p>
              <div className={`inline-flex px-3 py-1 rounded-full bg-${x.color}-500/10 border border-${x.color}-500/20`}>
                <span className={`text-${x.color}-400 text-[10px] font-bold`}>{x.perc}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-card p-4 bg-accent-500/[0.03] border-accent-500/20">
          <div className="flex items-center justify-center gap-3 text-xs">
            <SplitSquareHorizontal className="w-4 h-4 text-accent-400" />
            <p className="text-accent-300 font-medium">
              <strong>Após período estatístico significativo</strong> → a variação vencedora assume. As demais são descartadas ou recicladas.
            </p>
          </div>
        </motion.div>
      </div>
    )
  },

  /* ── 5. CAPTURA DE LEADS ── */
  {
    id: 'leads', label: 'Leads',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Conversão" title={<>Captura de leads <span className="text-gradient">antes do WhatsApp</span></>} />
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-6 items-start">
          <motion.div variants={fadeUp} className="space-y-4">
            <div className="glass-card p-5">
              <h4 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2">
                <FormInput className="w-4 h-4 text-accent-400" /> Fluxo de Conversão
              </h4>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Usuário chega via busca orgânica do Google', color: 'cyan' },
                  { step: '2', text: 'Lê a página otimizada para o termo que pesquisou', color: 'blue' },
                  { step: '3', text: 'Clica no CTA (botão de contato)', color: 'purple' },
                  { step: '4', text: 'Pop-up captura nome, email e telefone', color: 'accent' },
                  { step: '5', text: 'Dados salvos → Abre conversa no WhatsApp', color: 'emerald' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full bg-${s.color}-500/15 flex items-center justify-center shrink-0`}>
                      <span className={`text-[10px] font-bold text-${s.color}-400`}>{s.step}</span>
                    </div>
                    <span className="text-xs text-muted">{s.text}</span>
                    {i < 4 && <ArrowRight className="w-3 h-3 text-white/20 ml-auto shrink-0 hidden lg:block" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-4">
            <div className="glass-card p-5 border-accent-500/20">
              <h4 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-400" /> Por que capturar ANTES
              </h4>
              <p className="text-muted text-xs leading-relaxed mb-3">
                Se o usuário <strong className="text-white">desistir de enviar a mensagem no WhatsApp</strong>, 
                os dados já foram salvos. Isso permite:
              </p>
              <ul className="space-y-2 text-xs text-muted">
                {[
                  'Remarketing por email',
                  'Follow-up por telefone',
                  'Evita perda total do lead',
                  'Rastreamento completo da origem (UTM + A/B)',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-4 bg-purple-500/[0.03] border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Dados capturados</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Nome', 'Email', 'Telefone', 'Origem (UTM)', 'Variação A/B'].map((d, i) => (
                  <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted">{d}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  },

  /* ── 6. DOMÍNIO + AUTOCURA ── */
  {
    id: 'dominio', label: 'Domínio',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Estratégia" title={<>Fortalecer o domínio com <span className="text-gradient">autoridade real</span></>} />
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-5 gap-5">
          <motion.div variants={fadeUp} className="md:col-span-3 glass-card p-6">
            <h4 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent-400" /> Publicação em Subdiretório
            </h4>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-xs mb-4">
              <span className="text-accent-400">ideiamultichat.com.br</span><span className="text-white">/blog/</span><span className="text-muted">[slug]</span><br/>
              <span className="text-accent-400">ideiamultichat.com.br</span><span className="text-white">/solucoes/</span><span className="text-muted">[slug]</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Efeito acumulativo', desc: 'Cada página adiciona autoridade ao domínio principal' },
                { label: 'Topical Authority', desc: 'Google reconhece expertise no tema com dezenas de páginas aprofundadas' },
                { label: 'Sem diluição', desc: 'Subdomínios e domínios novos dividem autoridade — subdiretório concentra' },
              ].map((x, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />
                  <div><strong className="text-white">{x.label}:</strong> <span className="text-muted">{x.desc}</span></div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="md:col-span-2 space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCcw className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-display font-bold text-white">Autocura</h4>
              </div>
              <p className="text-muted text-xs leading-relaxed mb-3">
                Página perdeu ranking? O sistema detecta, analisa os novos concorrentes e <strong className="text-white">reescreve automaticamente</strong>.
              </p>
              <div className="flex items-center justify-center">
                <div className="glass-card p-4 text-center relative overflow-hidden w-full max-w-[120px] aspect-square flex flex-col items-center justify-center border-accent-500/15">
                  <div className="animate-spin-slow mb-2">
                    <svg className="w-10 h-10 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M2.13 15.57a9 9 0 0 0 16.59 2.56M2.5 22v-6h6M21.87 8.43a9 9 0 0 0-16.59-2.56" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-muted">Loop Infinito</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  },

  /* ── 7. STACK & CUSTOS ── */
  {
    id: 'custos', label: 'Custos',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Investimento em Ferramentas" title={<>Stack enxuta, <span className="text-gradient">custos controlados</span></>} />
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {/* Ferramentas pagas */}
          <motion.div variants={fadeUp} className="glass-card p-5">
            <h4 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" /> Investimento Mensal em Ferramentas
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-muted uppercase tracking-wider text-[10px] pb-2">Ferramenta</th>
                    <th className="text-left text-muted uppercase tracking-wider text-[10px] pb-2">Função</th>
                    <th className="text-right text-muted uppercase tracking-wider text-[10px] pb-2">Custo/mês</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2.5 text-white font-medium">Claude Code MAX</td>
                    <td className="py-2.5 text-muted">IA principal — geração de conteúdo, análise, quality gates</td>
                    <td className="py-2.5 text-right"><span className="text-amber-400 font-bold">~R$ 550–650</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">Anthropic API <span className="text-[10px] text-muted">(Claude)</span></td>
                    <td className="py-2.5 text-muted">Variação A do teste A/B + automações</td>
                    <td className="py-2.5 text-right"><span className="text-amber-400 font-bold">~R$ 100–300</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">OpenAI API <span className="text-[10px] text-muted">(GPT)</span></td>
                    <td className="py-2.5 text-muted">Variação B do teste A/B</td>
                    <td className="py-2.5 text-right"><span className="text-amber-400 font-bold">~R$ 50–150</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">Google AI <span className="text-[10px] text-muted">(Gemini)</span></td>
                    <td className="py-2.5 text-muted">Variação C do teste A/B</td>
                    <td className="py-2.5 text-right"><span className="text-amber-400 font-bold">~R$ 50–100</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Ferramentas gratuitas */}
          <motion.div variants={fadeUp} className="glass-card p-5 border-accent-500/15">
            <h4 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-400" /> Ferramentas com Plano Gratuito
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { t: 'Supabase', d: 'Banco de dados PostgreSQL + API', tag: 'FREE' },
                { t: 'Vercel', d: 'Hosting Next.js + Edge Network', tag: 'FREE' },
                { t: 'Apify', d: 'Scraping de termos e concorrência', tag: 'FREE TIER' },
                { t: 'Firecrawl', d: 'Raspagem de conteúdo concorrente', tag: 'FREE TIER' },
                { t: 'GA4 + Search Console', d: 'Analytics e monitoramento SEO', tag: 'FREE' },
                { t: 'Cloudflare', d: 'CDN + DNS + proteção', tag: 'FREE' },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-xs">{x.t}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-500/15 text-accent-400 font-bold">{x.tag}</span>
                    </div>
                    <p className="text-muted text-[10px]">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  },

  /* ── 8. ROADMAP ── */
  {
    id: 'roadmap', label: 'Roadmap',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Roadmap" title={<>Execução em <span className="text-gradient">etapas validadas</span></>} />
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: 0, t: 'Pesquisa & Estratégia', color: 'cyan', items: ['Mapear termos de cauda longa', 'Analisar concorrência', 'Definir tipos de páginas', 'Relatório para aprovação'] },
            { n: 1, t: 'MVP — 10 Páginas', color: 'accent', items: ['10 páginas otimizadas', 'Formulário de captura', 'Analytics configurado', 'Publicação no domínio'] },
            { n: 2, t: 'Teste A/B & Expansão', color: 'purple', items: ['3 IAs gerando variações', 'Sistema de A/B rodando', 'Expandir para 20-50 páginas', 'Ajustar conforme dados'] },
            { n: 3, t: 'Inteligência & Escala', color: 'blue', items: ['Dashboard de performance', 'Autocura ativada', 'Escalar o que converte', 'Otimização contínua'] },
          ].map((p, i) => (
            <motion.div key={i} variants={fadeUp} className={`glass-card p-5 border-t-2 border-t-${p.color}-500`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full bg-${p.color}-500/15 flex items-center justify-center font-display font-bold text-${p.color}-400 text-xs`}>
                    {p.n}
                  </div>
                  <h4 className="text-xs font-display font-bold text-white">{p.t}</h4>
                </div>
              </div>
              <ul className="space-y-1.5">
                {p.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted">
                    <CheckCircle2 className={`w-3 h-3 text-${p.color}-400 mt-0.5 shrink-0`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  },

  /* ── 9. PROPOSTA ── */
  {
    id: 'proposta', label: 'Proposta',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <div className="mb-5">
          <h2 className="text-accent-400 font-bold uppercase tracking-[0.2em] mb-2 text-[11px]">Proposta Comercial</h2>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white leading-tight">
            Investimento para <span className="text-gradient">resultado real</span>
          </h3>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="glass-card p-5 border-t-2 border-t-accent-500 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-40 h-40 bg-accent-500/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Badge color="accent">Etapas</Badge>
              <h4 className="text-base font-display font-bold text-white mt-3 mb-1">Modelo por etapas</h4>
              <p className="text-muted text-[11px] mb-3">Entrada, implantação e bônus vinculados ao resultado.</p>

              <div className="space-y-2.5">
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-display font-bold text-white">🔹 ETAPA 1 — MVP</p>
                      <p className="text-[11px] text-muted mt-1">Validação da estratégia e do processo.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted uppercase tracking-wider">Valor</p>
                      <p className="text-base font-display font-bold text-accent-400">R$ 3.000</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Entrada</p>
                      <p className="text-sm font-display font-bold text-white">R$ 1.500</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Saldo</p>
                      <p className="text-sm font-display font-bold text-white">R$ 1.500</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-display font-bold text-white">🔹 ETAPA 2 — Implantação Total</p>
                      <p className="text-[11px] text-muted mt-1">Execução completa após a validação do MVP.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted uppercase tracking-wider">Valor</p>
                      <p className="text-base font-display font-bold text-accent-400">R$ 2.000</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-display font-bold text-white">🔹 ETAPA 3 — Bônus de Sucesso do Cliente</p>
                        <p className="text-[11px] text-muted mt-1">Bonificação liberada quando o resultado validado virar cliente real.</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted uppercase tracking-wider">Valor</p>
                        <p className="text-base font-display font-bold text-accent-400">Até R$ 2.000</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                      <p className="text-[11px] font-display font-bold text-accent-300 mb-1">✅ Marco — R$ 2.000</p>
                      <p className="text-[10px] text-muted leading-relaxed">
                        3 clientes contratantes do IdeiaChat vindos das páginas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  },

  /* ── 10. CONSULTORIA DEV ── */
  {
    id: 'consultoria', label: 'Consultoria DEV',
    content: (
      <div className="flex flex-col justify-start min-h-full max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
        <SectionHeader tag="Consultoria Extra" title={<>Treinamento prático para o <span className="text-gradient">time DEV</span></>} />

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-[0.9fr_1.1fr] gap-4 items-stretch">
          <motion.div variants={fadeUp} className="glass-card p-6 border-t-2 border-t-blue-500">
            <Badge color="blue">Extra</Badge>
            <h4 className="text-lg font-display font-bold text-white mt-3 mb-2">Consultoria DEV</h4>
            <p className="text-muted text-sm mb-5 leading-relaxed">
              Sessão dedicada para mostrar como aplicar IA no fluxo real do time.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>2–3 horas</span>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 text-center">
                <p className="text-3xl font-display font-bold text-blue-400">R$ 500</p>
                <p className="text-xs text-muted mt-1">Sessão única</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-card p-6 border-t-2 border-t-accent-500/60">
            <h4 className="text-base font-display font-bold text-white mb-4">O que entra</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Workflows práticos com IA no dia a dia',
                'Automação de tarefas repetitivas',
                'Boas práticas para prompting e revisão',
                'Aplicação no contexto real do time',
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-white/90 leading-relaxed">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  },

  /* ── 11. CTA FINAL ── */
  {
    id: 'cta', label: 'Próximos Passos',
    content: (
      <div className="flex flex-col items-center justify-center min-h-full text-center px-4 sm:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-accent-400 font-bold uppercase tracking-[0.2em] mb-4 text-[11px]">Próximos Passos</h2>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4 leading-tight max-w-3xl mx-auto">
            Transformar buscas em{' '}
            <span className="text-gradient">clientes reais</span>
          </h3>
          <p className="text-muted text-sm mb-8 max-w-xl mx-auto">
            O sistema é inteligente, flexível e focado no que importa:{' '}
            <strong className="text-white">reduzir o custo de aquisição</strong> e{' '}
            <strong className="text-accent-400">aumentar conversões</strong>.
            Vamos começar com o Ideia Chat e escalar para qualquer nicho.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-8 text-xs">
          {[
            { icon: <Target className="w-4 h-4" />, v: 'Conversão', l: 'Objetivo #1' },
            { icon: <Users className="w-4 h-4" />, v: '10 Páginas', l: 'MVP Piloto' },
            { icon: <Activity className="w-4 h-4" />, v: '3 IAs', l: 'Teste A/B Nativo' },
            { icon: <BarChart3 className="w-4 h-4" />, v: 'Menor CAC', l: 'Resultado Final' },
          ].map((k, i) => (
            <div key={i} className="glass-card px-5 py-3 text-center min-w-[110px]">
              <div className="flex justify-center text-accent-400 mb-1.5">{k.icon}</div>
              <div className="text-base font-display font-bold text-white">{k.v}</div>
              <div className="text-muted text-[10px] mt-0.5">{k.l}</div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} 
          className="glass-card p-5 max-w-2xl border-accent-500/20 bg-accent-500/[0.03]">
          <p className="text-accent-300 text-xs leading-relaxed">
            💡 O melhor resultado vem de uma <strong>parceria contínua</strong> — onde estratégia de marketing 
            e evolução técnica caminham juntas. Proponho um modelo de <strong>acompanhamento mensal fixo</strong> após 
            o MVP, definido em conjunto com base nos resultados alcançados.
          </p>
        </motion.div>
      </div>
    )
  },
];

/* ════════════════════════════════════════
   APP (SLIDER)
   ════════════════════════════════════════ */

function App() {
  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && cur < slides.length - 1) { setDir(1); setCur(c => c + 1); }
      if (e.key === 'ArrowLeft' && cur > 0) { setDir(-1); setCur(c => c - 1); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cur]);

  const go = (i: number) => { setDir(i > cur ? 1 : -1); setCur(i); };
  const pct = ((cur + 1) / slides.length) * 100;

  const sv = {
    enter: (d: number) => ({ x: d > 0 ? 600 : -600, opacity: 0, scale: 0.98 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1, transition: { x: { type: 'spring' as const, stiffness: 350, damping: 32 }, opacity: { duration: 0.3 }, scale: { duration: 0.3 } } },
    exit: (d: number) => ({ zIndex: 0, x: d < 0 ? 600 : -600, opacity: 0, scale: 0.98, transition: { x: { type: 'spring' as const, stiffness: 350, damping: 32 }, opacity: { duration: 0.25 } } }),
  };

  return (
    <div className="h-screen bg-[#060608] font-sans relative overflow-hidden flex flex-col selection:bg-accent-500/50">
      <div className="hero-background absolute inset-0 z-0 bg-grid-white" />

      {/* Header */}
      <header className="absolute top-3 left-5 right-5 z-50 py-3 px-6 flex justify-between items-center backdrop-blur-xl bg-black/50 border border-white/[0.05] rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-accent-500" />
          </div>
          <span className="font-display font-bold tracking-[0.15em] uppercase text-[10px] text-white/80">IDEIA PAGES</span>
        </div>
        <div className="text-[10px] font-medium text-white/50 flex items-center gap-2">
          <span className="hidden sm:inline text-white/30">{slides[cur].label}</span>
          <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <span className="text-white font-bold">{cur + 1}</span>
            <span className="opacity-30">/{slides.length}</span>
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="absolute top-[58px] left-5 right-5 z-50 h-[1.5px] bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-accent-500 to-cyan-400 rounded-full"
          initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.35, ease: 'easeOut' }} />
      </div>

      {/* Slides */}
      <main className="relative z-10 flex-1 min-h-0 w-full">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div key={cur} custom={dir} variants={sv} initial="enter" animate="center" exit="exit"
            className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain pt-24 pb-24 sm:pt-28 sm:pb-28 px-4 sm:px-6">
            {slides[cur].content}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full z-50 p-4 flex justify-center items-center gap-5 bg-gradient-to-t from-[#060608] via-[#060608]/90 to-transparent">
        <button onClick={() => { if (cur > 0) { setDir(-1); setCur(c => c - 1); } }}
          disabled={cur === 0}
          className="p-2.5 rounded-full glass hover:bg-white/10 disabled:opacity-10 disabled:cursor-not-allowed transition-all active:scale-95 group">
          <ChevronLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <button key={i} onClick={() => go(i)} title={s.label}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === cur ? 'w-8 bg-accent-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'w-1.5 bg-white/12 hover:bg-white/25'}`} />
          ))}
        </div>

        <button onClick={() => { if (cur < slides.length - 1) { setDir(1); setCur(c => c + 1); } }}
          disabled={cur === slides.length - 1}
          className="p-2.5 rounded-full glass hover:bg-white/10 disabled:opacity-10 disabled:cursor-not-allowed transition-all active:scale-95 group">
          <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      </footer>
    </div>
  );
}

export default App;
