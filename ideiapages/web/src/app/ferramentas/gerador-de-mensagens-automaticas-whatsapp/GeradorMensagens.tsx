"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarCheck,
  Check,
  Clock,
  Copy,
  FileText,
  GraduationCap,
  Hand,
  Home,
  ListChecks,
  MessageSquare,
  Moon,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  ThumbsUp,
  Users,
  Utensils,
  Wrench,
  Zap,
} from "lucide-react";
import {
  CATEGORIAS,
  SEGMENTOS,
  aplicarVariaveis,
  gerar,
  type CategoriaId,
  type SegmentoId,
} from "@/lib/ferramentas/mensagens-automaticas";

const WHATSAPP =
  "https://wa.me/5551998681452?text=" +
  encodeURIComponent(
    "Oi! Usei o gerador de mensagens automáticas do Ideia Chat e quero ver como automatizar isso no meu WhatsApp.",
  );
const LP_PLATAFORMA =
  "https://www.ideiamultichat.com.br/solucoes/sistema-de-atendimento-whatsapp-para-empresas";

const ICONE_CATEGORIA: Record<CategoriaId, React.ComponentType<{ className?: string }>> = {
  saudacao: Hand,
  "menu-setores": ListChecks,
  "fora-horario": Moon,
  ausencia: Clock,
  confirmacao: CalendarCheck,
  lembrete: Bell,
  orcamento: FileText,
  "pos-venda": ThumbsUp,
};

const ICONE_SEGMENTO: Record<SegmentoId, React.ComponentType<{ className?: string }>> = {
  geral: Building2,
  contabilidade: FileText,
  clinica: Stethoscope,
  imobiliaria: Home,
  loja: ShoppingBag,
  servicos: Wrench,
  restaurante: Utensils,
  escola: GraduationCap,
};

function horaAgora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ───────────────────────── Phone mock (WhatsApp) ───────────────────────── */

function Telefone({
  empresa,
  mensagem,
  compacto = false,
}: {
  empresa: string;
  mensagem: string;
  compacto?: boolean;
}) {
  const nome = empresa.trim() || "Sua empresa";
  const hora = horaAgora();
  return (
    <div
      className={`relative mx-auto w-full ${compacto ? "max-w-[300px]" : "max-w-[340px]"} rounded-[2.2rem] border-[6px] border-[#111827] bg-[#111827] shadow-[0_30px_80px_-20px_rgba(2,6,23,.7)]`}
    >
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#111827]" />
      <div className="overflow-hidden rounded-[1.8rem] bg-[#efeae2]">
        {/* topo do WhatsApp */}
        <div className="flex items-center gap-3 bg-[#075E54] px-4 pb-3 pt-8 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {nome.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{nome}</p>
            <p className="text-[11px] leading-tight text-white/75">online</p>
          </div>
        </div>
        {/* conversa */}
        <div
          className={`space-y-2 px-3 ${compacto ? "py-4" : "py-5"}`}
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,.045) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        >
          <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-slate-800 shadow-sm">
            Oi, boa tarde! Queria uma informação.
            <span className="ml-2 align-bottom text-[10px] text-slate-400">{hora}</span>
          </div>
          <div className="ml-auto max-w-[88%] whitespace-pre-wrap rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[13px] leading-snug text-slate-800 shadow-sm">
            {mensagem}
            <span className="ml-2 inline-flex items-center gap-1 align-bottom text-[10px] text-slate-500">
              {hora}
              <Check className="h-3 w-3 text-[#53bdeb]" />
            </span>
          </div>
        </div>
        {/* barra de digitação */}
        <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2">
          <div className="h-8 flex-1 rounded-full bg-white px-3 text-[12px] leading-8 text-slate-400">
            Mensagem
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white">
            <Zap className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Página ───────────────────────── */

export function GeradorMensagens() {
  const [categoria, setCategoria] = useState<CategoriaId>("saudacao");
  const [segmento, setSegmento] = useState<SegmentoId>("geral");
  const [empresa, setEmpresa] = useState("");
  const [horario, setHorario] = useState("");
  const [modelo, setModelo] = useState(0);
  const [copiada, setCopiada] = useState<number | null>(null);

  const mensagens = useMemo(
    () => gerar(categoria, segmento).map((m) => aplicarVariaveis(m, { empresa, horario })),
    [categoria, segmento, empresa, horario],
  );
  const idx = Math.min(modelo, mensagens.length - 1);
  const atual = mensagens[idx] ?? "";
  const catAtual = CATEGORIAS.find((c) => c.id === categoria);

  async function copiar(texto: string, i: number) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiada(i);
    setTimeout(() => setCopiada((c) => (c === i ? null : c)), 1800);
  }

  function escolherCategoria(id: CategoriaId) {
    setCategoria(id);
    setModelo(0);
  }
  function escolherSegmento(id: SegmentoId) {
    setSegmento(id);
    setModelo(0);
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b border-white/10 text-white"
        style={{ backgroundColor: "#0f172a" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 70% at 78% 40%, rgba(34,130,199,.35) 0%, rgba(34,130,199,0) 70%), radial-gradient(40% 50% at 15% 90%, rgba(37,211,102,.14) 0%, rgba(37,211,102,0) 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[.18]"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-24">
          <div>
            <p className="font-ideia text-[13px] font-bold uppercase tracking-[0.2em] text-ideia-chat">
              Ferramenta gratuita · Ideia Chat
            </p>
            <h1 className="mt-4 font-ideia text-4xl font-black leading-[1.05] sm:text-5xl lg:text-[3.6rem]">
              Gerador de mensagens automáticas para WhatsApp
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100/85">
              Escolha o tipo de mensagem e o seu ramo, coloque o nome da empresa e copie o texto
              pronto — saudação, menu de setores, fora do horário, confirmação, lembrete, orçamento e
              pós-atendimento. Escritas para soar como empresa, não como robô.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {[
                [ShieldCheck, "Nada do que você digita é enviado"],
                [Sparkles, "+30 modelos por tipo de negócio"],
                [Zap, "Sem cadastro, sem cartão"],
              ].map(([Icone, texto], i) => {
                const I = Icone as React.ComponentType<{ className?: string }>;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3.5 py-1.5 text-[13px] font-medium text-blue-50"
                  >
                    <I className="h-3.5 w-3.5 text-[#25D366]" />
                    {texto as string}
                  </span>
                );
              })}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#gerador"
                className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-[#1fb457]"
              >
                Gerar minha mensagem
              </a>
              <a
                href="#como-usar"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:border-white/50"
              >
                Onde colar no WhatsApp Business
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <Telefone empresa={empresa} mensagem={atual} />
          </div>
        </div>
      </section>

      {/* ── FAIXA DE CONFIANÇA ───────────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-4 text-sm text-text-muted">
          <span className="font-ideia text-lg font-black tracking-tight text-ideia-primary">
            IDeia<span className="text-ideia-chat">Chat</span>
          </span>
          <span>
            <strong className="font-semibold text-text">+400 empresas</strong> usam a plataforma.
            Atendimento humano, IA e API oficial do WhatsApp Business.
          </span>
        </div>
      </div>

      {/* ── GERADOR ──────────────────────────────────────────────────── */}
      <section id="gerador" className="scroll-mt-6 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
              <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
              01 · Monte a mensagem
            </p>
            <h2 className="mt-3 font-ideia text-3xl font-black leading-tight text-slate-900 md:text-4xl">
              Três escolhas e o texto está pronto
            </h2>
            <p className="mt-3 text-slate-600">
              O modelo muda conforme o ramo: uma clínica confirma consulta, um escritório contábil
              cobra documento, uma loja pergunta o pedido. A prévia ao lado é o que o seu cliente vê.
            </p>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
            {/* controles */}
            <div className="space-y-8">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900">Tipo de mensagem</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CATEGORIAS.map((c) => {
                    const Icone = ICONE_CATEGORIA[c.id];
                    const ativo = c.id === categoria;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => escolherCategoria(c.id)}
                        aria-pressed={ativo}
                        className={`group flex min-h-[92px] flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                          ativo
                            ? "border-ideia-primary bg-ideia-primary text-white shadow-md"
                            : "border-blue-200/70 bg-blue-50 text-slate-800 hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                      >
                        <Icone className={`h-5 w-5 ${ativo ? "text-white" : "text-ideia-primary"}`} />
                        <span className="text-[13px] font-semibold leading-tight">
                          {c.nome.replace(" (primeira mensagem)", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {catAtual && <p className="mt-3 text-sm text-slate-500">{catAtual.descricao}</p>}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900">Tipo de negócio</p>
                <div className="flex flex-wrap gap-2">
                  {SEGMENTOS.map((s) => {
                    const Icone = ICONE_SEGMENTO[s.id];
                    const ativo = s.id === segmento;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => escolherSegmento(s.id)}
                        aria-pressed={ativo}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                          ativo
                            ? "border-[#0c1929] bg-[#0c1929] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        <Icone className="h-3.5 w-3.5" />
                        {s.nome.replace(" (qualquer empresa)", "")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">
                    Nome da empresa{" "}
                    <span className="font-normal text-slate-400">(opcional)</span>
                  </span>
                  <input
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex.: Contabilidade Vértice"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ideia-primary focus:ring-4 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">
                    Horário de atendimento{" "}
                    <span className="font-normal text-slate-400">(opcional)</span>
                  </span>
                  <input
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="Ex.: de segunda a sexta, das 8h às 18h"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ideia-primary focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              {/* variações */}
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Modelos para esta escolha{" "}
                  <span className="font-normal text-slate-400">({mensagens.length})</span>
                </p>
                <div className="space-y-3">
                  {mensagens.map((m, i) => {
                    const selecionado = i === idx;
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl border p-4 transition ${
                          selecionado
                            ? "border-ideia-primary bg-blue-50/60"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setModelo(i)}
                            className={`text-xs font-bold uppercase tracking-wide ${
                              selecionado ? "text-ideia-primary" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {selecionado ? "● " : "○ "}Modelo {i + 1}
                          </button>
                          <button
                            type="button"
                            onClick={() => copiar(m, i)}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              copiada === i
                                ? "bg-[#25D366] text-white"
                                : "bg-ideia-primary text-white hover:bg-ideia-primary-dark"
                            }`}
                          >
                            {copiada === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiada === i ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-slate-700">
                          {m}
                        </pre>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
                  Os trechos entre chaves — {"{nome}"}, {"{empresa}"}, {"{horario}"} e {"{atendente}"} —
                  são preenchidos sozinhos quando a mensagem sai de uma plataforma de atendimento. No
                  aplicativo WhatsApp Business, troque na mão antes de salvar.
                </p>
              </div>
            </div>

            {/* prévia */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="rounded-3xl bg-[#0c1929] p-6 sm:p-8">
                <p className="font-ideia text-[12px] font-bold uppercase tracking-[0.18em] text-ideia-chat">
                  Prévia · como o cliente vê
                </p>
                <div className="mt-5">
                  <Telefone empresa={empresa} mensagem={atual} compacto />
                </div>
                <button
                  type="button"
                  onClick={() => copiar(atual, 100 + idx)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold text-white transition ${
                    copiada === 100 + idx ? "bg-[#1fb457]" : "bg-[#25D366] hover:bg-[#1fb457]"
                  }`}
                >
                  {copiada === 100 + idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiada === 100 + idx ? "Copiado para a área de transferência" : "Copiar este modelo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO USAR ────────────────────────────────────────────────── */}
      <section id="como-usar" className="scroll-mt-6 bg-surface-alt py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
            <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
            02 · Onde colar
          </p>
          <h2 className="mt-3 font-ideia text-3xl font-black leading-tight text-slate-900 md:text-4xl">
            Como colocar a mensagem automática no WhatsApp Business
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Saudação",
                d: "Configurações › Ferramentas comerciais › Mensagem de saudação. Dispara para quem fala com você pela primeira vez ou depois de 14 dias sem contato.",
              },
              {
                n: "2",
                t: "Ausência (fora do horário)",
                d: "Configurações › Ferramentas comerciais › Mensagem de ausência. Defina o horário comercial e ela responde sozinha fora dele.",
              },
              {
                n: "3",
                t: "Respostas rápidas",
                d: "Configurações › Ferramentas comerciais › Respostas rápidas. Salve confirmação, lembrete e orçamento como atalhos e dispare digitando /.",
              },
            ].map((p) => (
              <div
                key={p.n}
                className="rounded-2xl border border-blue-200/60 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ideia-primary/10 font-ideia text-sm font-black text-ideia-primary">
                  {p.n}
                </div>
                <h3 className="mt-4 font-ideia text-lg font-black text-slate-900">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Menu de setores, fila e envio conforme quem é o cliente não existem no aplicativo — esses
            só funcionam em uma plataforma conectada à API Oficial do WhatsApp.
          </p>
        </div>
      </section>

      {/* ── CTA ESCURO ───────────────────────────────────────────────── */}
      <section className="bg-[#0c1929] py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-start gap-10 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
                <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
                03 · E amanhã?
              </p>
              <h2 className="mt-3 font-ideia text-3xl font-black leading-tight md:text-4xl">
                Copiar e colar resolve hoje.
                <br />
                Atendimento de verdade é quando a mensagem sabe quem é o cliente.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-white/80">
                No aplicativo, a mensagem é fixa, vale para uma pessoa em um aparelho e não sabe com
                quem está falando. No <strong className="text-white">Ideia Chat</strong>, o mesmo texto
                vira fluxo: a saudação pergunta o setor, o menu joga na fila certa, o lembrete sai
                sozinho na data — com vários atendentes no mesmo número, agente de IA e API Oficial da
                Meta.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white transition hover:bg-[#1fb457]"
                >
                  <MessageSquare className="h-4 w-4" />
                  Falar com um especialista
                </a>
                <a
                  href={LP_PLATAFORMA}
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white transition hover:border-white/60"
                >
                  Ver a plataforma de atendimento
                </a>
              </div>
              <p className="mt-4 text-xs text-white/50">
                Teste grátis por 7 dias, sem cartão · +400 empresas usam o Ideia Chat
              </p>
            </div>
            <div className="grid gap-4">
              {[
                [Users, "Vários atendentes no mesmo número", "Cada pessoa com o próprio login; a conversa cai numa fila e tem dono."],
                [Sparkles, "Agente de IA na frente", "Responde o básico, faz a triagem e passa para o humano com o histórico."],
                [ShieldCheck, "API Oficial da Meta", "Sem gambiarra e sem risco de banimento — o único caminho autorizado para escalar."],
              ].map(([Icone, t, d], i) => {
                const I = Icone as React.ComponentType<{ className?: string }>;
                return (
                  <div
                    key={i}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.05] p-5 transition hover:bg-white/[.08]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-ideia-chat">
                      <I className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-ideia font-black text-white">{t as string}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/75">{d as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
