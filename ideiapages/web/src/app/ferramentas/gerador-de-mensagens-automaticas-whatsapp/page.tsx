import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { GeradorMensagens } from "./GeradorMensagens";
import { WhatsAppFlutuante } from "../_components/WhatsAppFlutuante";

/**
 * Ferramenta-isca (autorizada pelo Victor em 12/08/2026).
 * Alvo do GATE de 10/09: cluster "mensagem automática whatsapp" (~100 mil buscas/mês no Brasil).
 * Roda 100% no cliente — nenhum dado do visitante é enviado ou guardado.
 */

const URL_CANONICA =
  "https://pages.ideiabusiness.com.br/ferramentas/gerador-de-mensagens-automaticas-whatsapp";

export const metadata: Metadata = {
  title: "Gerador de mensagens automáticas para WhatsApp grátis (sem cadastro)",
  description:
    "Gere mensagens automáticas de WhatsApp prontas para copiar: saudação, menu de setores, fora do horário, confirmação, lembrete e pós-atendimento — por tipo de negócio. Grátis e sem cadastro.",
  alternates: { canonical: URL_CANONICA },
  openGraph: {
    title: "Gerador de mensagens automáticas para WhatsApp grátis",
    description:
      "Modelos prontos de mensagem automática por categoria e por tipo de negócio. Copie, ajuste e use hoje.",
    url: URL_CANONICA,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const FAQ = [
  {
    pergunta: "Como colocar mensagem automática no WhatsApp Business?",
    resposta:
      "No aplicativo WhatsApp Business, abra Configurações › Ferramentas comerciais. Ali existem três recursos: mensagem de saudação (para quem fala com você pela primeira vez ou após 14 dias), mensagem de ausência (para fora do horário) e respostas rápidas (atalhos que você dispara digitando /). Gere o texto aqui, copie e cole no campo correspondente.",
  },
  {
    pergunta: "Quantas mensagens automáticas o WhatsApp Business permite?",
    resposta:
      "O aplicativo permite uma mensagem de saudação e uma de ausência por conta, além das respostas rápidas. Não há menu de setores, fila nem envio condicional: para isso é preciso uma plataforma conectada à API Oficial do WhatsApp.",
  },
  {
    pergunta: "Dá para enviar mensagem automática para vários clientes de uma vez?",
    resposta:
      "Pelo aplicativo, não de forma confiável — listas de transmissão só chegam a quem tem seu número salvo, e ferramentas de disparo não oficiais colocam o número em risco de banimento. O envio proativo em escala é feito com templates aprovados pela Meta, através da API Oficial.",
  },
  {
    pergunta: "Essas mensagens funcionam no WhatsApp comum?",
    resposta:
      "As de saudação e ausência são recursos do WhatsApp Business (gratuito), não do WhatsApp pessoal. No pessoal você pode salvar os textos e enviar manualmente.",
  },
  {
    pergunta: "O gerador é gratuito? Precisa cadastro?",
    resposta:
      "É gratuito e não pede cadastro. Tudo é gerado no seu navegador: nada do que você digita é enviado ou armazenado.",
  },
];

const LEITURAS = [
  {
    href: "https://www.ideiamultichat.com.br/solucoes/o-que-e-api-oficial-do-whatsapp-e-por-que-usar",
    titulo: "API Oficial do WhatsApp: o que é, quanto custa e como contratar",
    desc: "A base técnica que permite vários atendentes, automação e mensagens proativas sem risco de banimento.",
  },
  {
    href: "https://www.ideiamultichat.com.br/solucoes/como-colocar-varios-atendentes-no-mesmo-numero-whatsapp",
    titulo: "Vários atendentes no mesmo WhatsApp",
    desc: "Como funciona o multiatendimento: login por atendente, filas e histórico unificado.",
  },
  {
    href: "https://www.ideiamultichat.com.br/solucoes/sistema-de-atendimento-whatsapp-para-empresas",
    titulo: "Plataforma de atendimento WhatsApp para empresas",
    desc: "Central de atendimento com IA e API Oficial Meta — teste grátis por 7 dias.",
  },
];

export default function GeradorMensagensPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.pergunta,
      acceptedAnswer: { "@type": "Answer", text: f.resposta },
    })),
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Gerador de mensagens automáticas para WhatsApp",
    url: URL_CANONICA,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    publisher: { "@type": "Organization", name: "Ideia Chat", url: "https://www.ideiamultichat.com.br" },
  };

  return (
    <main className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />

      <GeradorMensagens />

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
              <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
              04 · Dúvidas
            </p>
            <h2 className="mt-3 font-ideia text-3xl font-black leading-tight text-slate-900 md:text-4xl">
              Perguntas frequentes
            </h2>
            <p className="mt-3 text-slate-600">
              O que mais chega no suporte sobre mensagem automática — respondido direto.
            </p>
          </div>
          <dl className="space-y-4">
            {FAQ.map((f) => (
              <div
                key={f.pergunta}
                className="rounded-2xl border border-blue-200/60 bg-blue-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <dt className="font-ideia text-[17px] font-black text-slate-900">{f.pergunta}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-slate-700">{f.resposta}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── LEITURAS ────────────────────────────────────────────────── */}
      <section className="bg-surface-alt py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
            <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
            Continue lendo
          </p>
          <h2 className="mt-3 font-ideia text-3xl font-black leading-tight text-slate-900 md:text-4xl">
            Do texto pronto ao atendimento que escala
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LEITURAS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-ideia-primary hover:shadow-md"
              >
                <div>
                  <h3 className="font-ideia text-lg font-black leading-snug text-slate-900 group-hover:text-ideia-primary">
                    {l.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{l.desc}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ideia-primary">
                  Ler <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppFlutuante mensagem="Oi! Usei o gerador de mensagens automáticas do Ideia Chat e quero falar com o comercial." />

      <footer className="border-t border-border bg-white py-8 text-center text-xs text-text-subtle">
        Gerador de mensagens automáticas para WhatsApp — uma ferramenta gratuita do{" "}
        <a href="https://www.ideiamultichat.com.br" className="font-semibold text-ideia-link hover:underline">
          Ideia Chat
        </a>
        , plataforma de atendimento WhatsApp desenvolvida pela Ideia Business.
      </footer>
    </main>
  );
}
