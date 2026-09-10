"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Share2,
  Link2,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  MODELOS,
  formatarVisual,
  montarLink,
  snippetBotao,
  urlQrCode,
  validarNumero,
} from "@/lib/ferramentas/link-whatsapp";

const WHATSAPP =
  "https://wa.me/5551998681452?text=" +
  encodeURIComponent(
    "Oi! Usei o gerador de link do Ideia Chat e quero ver como organizar o atendimento da minha equipe.",
  );
const LP_PLATAFORMA =
  "https://www.ideiamultichat.com.br/solucoes/sistema-de-atendimento-whatsapp-para-empresas";
const GERADOR_MENSAGENS = "/ferramentas/gerador-de-mensagens-automaticas-whatsapp";

export function GeradorLink() {
  const [numero, setNumero] = useState("");
  const [modelo, setModelo] = useState("geral");
  const [mensagem, setMensagem] = useState(MODELOS[1]!.texto);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [verQr, setVerQr] = useState(false);

  const validacao = useMemo(() => validarNumero(numero), [numero]);
  const link = useMemo(
    () => (validacao.ok ? montarLink(numero, mensagem) : ""),
    [numero, mensagem, validacao.ok],
  );
  const snippet = useMemo(() => (link ? snippetBotao(link) : ""), [link]);

  async function copiar(texto: string, chave: string) {
    if (!texto) return;
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
    setCopiado(chave);
    setTimeout(() => setCopiado((c) => (c === chave ? null : c)), 1800);
  }

  function escolherModelo(id: string) {
    setModelo(id);
    const m = MODELOS.find((x) => x.id === id);
    if (m) setMensagem(m.texto);
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
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <p className="font-ideia text-[13px] font-bold uppercase tracking-[0.2em] text-ideia-chat">
            Ferramenta gratuita · Ideia Chat
          </p>
          <h1 className="mt-4 max-w-3xl font-ideia text-4xl font-black leading-[1.05] sm:text-5xl">
            Gerador de link do WhatsApp
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-100/85">
            Crie o link que abre a conversa no seu WhatsApp <b className="text-white">já com a mensagem
            escrita</b> — para colar na bio do Instagram, no botão do site, no QR code do balcão ou no
            anúncio. Quem clica não precisa salvar o seu número.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {[
              [ShieldCheck, "Nada do que você digita é enviado"],
              [QrCode, "Sai com QR code e botão pro site"],
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
        </div>
      </section>

      {/* faixa de confiança */}
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
      <section id="gerador" className="scroll-mt-6 bg-white py-14 md:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* entradas */}
            <div className="min-w-0 space-y-7">
              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">
                    1. Seu número com DDD
                  </span>
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    inputMode="tel"
                    placeholder="Ex.: (51) 99868-1452"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ideia-primary focus:ring-4 focus:ring-blue-100"
                  />
                </label>
                {numero && validacao.ok && (
                  <p className="mt-2 text-sm text-slate-500">
                    Vai virar <b className="text-slate-800">{formatarVisual(numero)}</b> — o WhatsApp usa o
                    formato internacional, com o 55 do Brasil na frente.
                  </p>
                )}
                {numero && !validacao.ok && validacao.aviso && (
                  <p className="mt-2 text-sm font-medium text-amber-600">{validacao.aviso}</p>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  2. A mensagem que já vem escrita{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {MODELOS.map((m) => {
                    const ativo = m.id === modelo;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => escolherModelo(m.id)}
                        aria-pressed={ativo}
                        className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                          ativo
                            ? "border-[#0c1929] bg-[#0c1929] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {m.nome}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  placeholder="Escreva a mensagem que o cliente vai enviar…"
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ideia-primary focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-[13px] text-slate-500">
                  Precisa de ideia de texto?{" "}
                  <a href={GERADOR_MENSAGENS} className="font-semibold text-ideia-link hover:underline">
                    Use o gerador de mensagens automáticas
                  </a>{" "}
                  e volte com o texto pronto.
                </p>
              </div>

              {/* resultado */}
              <div className="rounded-2xl border border-blue-200/60 bg-blue-50 p-5">
                <p className="text-sm font-semibold text-slate-900">3. Seu link está pronto</p>
                <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-blue-200 bg-white px-3 py-3 text-[13px] text-slate-800">
                    {link || "https://wa.me/…"}
                  </code>
                  <button
                    type="button"
                    onClick={() => copiar(link, "link")}
                    disabled={!link}
                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      copiado === "link" ? "bg-[#1fb457]" : "bg-[#25D366] hover:bg-[#1fb457]"
                    }`}
                  >
                    {copiado === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiado === "link" ? "Copiado" : "Copiar link"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={link || undefined}
                    target="_blank"
                    rel="noopener"
                    aria-disabled={!link}
                    className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500 ${
                      link ? "" : "pointer-events-none opacity-40"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Testar o link
                  </a>
                  <button
                    type="button"
                    onClick={() => setVerQr((v) => !v)}
                    disabled={!link}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500 disabled:opacity-40"
                  >
                    <QrCode className="h-3.5 w-3.5" /> {verQr ? "Esconder" : "Ver"} QR code
                  </button>
                  <button
                    type="button"
                    onClick={() => copiar(snippet, "botao")}
                    disabled={!link}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500 disabled:opacity-40"
                  >
                    {copiado === "botao" ? <Check className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                    {copiado === "botao" ? "Código copiado" : "Copiar botão para o site"}
                  </button>
                </div>
                {verQr && link && (
                  <div className="mt-4 flex items-center gap-4 rounded-xl border border-blue-200 bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado sob demanda */}
                    <img src={urlQrCode(link, 200)} alt="QR code do link do WhatsApp" width={120} height={120} />
                    <div className="text-sm text-slate-600">
                      Clique com o botão direito para salvar. Serve para cartão, vitrine, balcão e cardápio —
                      quem aponta a câmera cai direto na conversa.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* onde usar */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="rounded-3xl bg-[#0c1929] p-7 text-white">
                <p className="font-ideia text-[12px] font-bold uppercase tracking-[0.18em] text-ideia-chat">
                  Onde colar esse link
                </p>
                <ul className="mt-5 space-y-4">
                  {[
                    [Share2, "Bio do Instagram e TikTok", "O “link na bio” que abre conversa em vez de mandar o cliente procurar o número."],
                    [Link2, "Botão do site", "Copie o código pronto e cole na página — vira um botão verde de WhatsApp."],
                    [QrCode, "QR code no balcão ou no cartão", "Cliente aponta a câmera e já chega com a mensagem escrita."],
                    [Sparkles, "Anúncio e e-mail", "Coloque no anúncio, na assinatura ou no orçamento que você manda."],
                  ].map(([Icone, t, d], i) => {
                    const I = Icone as React.ComponentType<{ className?: string }>;
                    return (
                      <li key={i} className="flex gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-ideia-chat">
                          <I className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-ideia font-black">{t as string}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-white/75">{d as string}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-[#0c1929] py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div>
              <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
                <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
                Depois do link
              </p>
              <h2 className="mt-3 font-ideia text-3xl font-black leading-tight md:text-4xl">
                O link traz o cliente.
                <br />O problema seguinte é quem responde.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-white/80">
                Funciona bem até chegarem trinta mensagens no mesmo dia e uma pessoa só ter o celular na
                mão. No <b className="text-white">Ideia Chat</b>, o mesmo número passa a atender com a
                equipe inteira: cada atendente com o próprio login, conversa distribuída por setor,
                histórico por cliente e um agente de IA que responde o básico — sobre a API Oficial da
                Meta, sem risco de banimento.
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
                [Users, "Vários atendentes no mesmo número", "Sem revezar celular: cada pessoa com o próprio acesso."],
                [Sparkles, "Agente de IA na frente", "Responde o básico e passa para o humano com o histórico."],
                [ShieldCheck, "API Oficial da Meta", "O único caminho autorizado para escalar sem perder o número."],
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
