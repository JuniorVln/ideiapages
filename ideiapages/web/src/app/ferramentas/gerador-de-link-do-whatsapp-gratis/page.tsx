import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { GeradorLink } from "./GeradorLink";
import { FERRAMENTAS, urlFerramenta } from "@/lib/ferramentas/urls";
import { WhatsAppFlutuante } from "../_components/WhatsAppFlutuante";

/**
 * Ferramenta-isca 2 — gerador de link do WhatsApp.
 * Alvo (GATE rodada 4, 10/09/2026): "link whatsapp" 301.000 buscas/mês; a família passa de 350 mil.
 * É a maior fonte de tráfego orgânico do nicho e o tipo de página que ganha link de outros sites.
 */

const URL_CANONICA = urlFerramenta(FERRAMENTAS.linkWhatsapp);

export const metadata: Metadata = {
  title: "Gerador de link do WhatsApp grátis (com mensagem e QR code)",
  description:
    "Gere o link do WhatsApp com mensagem pronta, QR code e botão para o site. Grátis, sem cadastro: digite o número com DDD e copie o link para a bio do Instagram, site ou anúncio.",
  alternates: { canonical: URL_CANONICA },
  openGraph: {
    title: "Gerador de link do WhatsApp grátis, sem cadastro",
    description:
      "Crie o link wa.me com mensagem já escrita, QR code e botão pronto para o site. Sem cadastro.",
    url: URL_CANONICA,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const FAQ = [
  {
    pergunta: "Como criar um link do WhatsApp?",
    resposta:
      "O formato é https://wa.me/ seguido do número no padrão internacional — no Brasil, 55, o DDD e o número, sem espaço, parêntese ou traço. Para já enviar um texto, acrescente ?text= e a mensagem. Este gerador monta tudo isso e ainda codifica os acentos corretamente.",
  },
  {
    pergunta: "Como colocar o link do WhatsApp na bio do Instagram?",
    resposta:
      "Copie o link gerado aqui, abra o Instagram, toque em Editar perfil e cole no campo de link (ou em Links, se o seu perfil tiver a opção de vários). Quem tocar cai direto na sua conversa, com a mensagem já escrita.",
  },
  {
    pergunta: "A pessoa precisa ter meu número salvo?",
    resposta:
      "Não. É justamente para isso que o link serve: abre a conversa mesmo que o número não esteja na agenda de quem clicou.",
  },
  {
    pergunta: "Funciona com número fixo ou 0800?",
    resposta:
      "Funciona com qualquer número que tenha uma conta de WhatsApp ativa, inclusive fixo com WhatsApp Business. Números 0800 não têm conta de WhatsApp e por isso não funcionam.",
  },
  {
    pergunta: "Dá para gerar um QR code do WhatsApp?",
    resposta:
      "Sim. Depois de criar o link, clique em Ver QR code e salve a imagem — serve para cartão de visita, vitrine, balcão, cardápio ou material impresso.",
  },
  {
    pergunta: "O link tem limite de uso ou custo?",
    resposta:
      "Não. O link wa.me é um recurso do próprio WhatsApp, gratuito e sem limite de cliques. Este gerador também é gratuito e não pede cadastro: nada do que você digita sai do seu navegador.",
  },
  {
    pergunta: "O link some se eu trocar de celular?",
    resposta:
      "Não, ele depende só do número. Enquanto o número tiver WhatsApp ativo, o link continua funcionando em qualquer aparelho.",
  },
];

const LEITURAS = [
  {
    href: "/ferramentas/gerador-de-mensagens-automaticas-whatsapp-gratis",
    titulo: "Gerador de mensagens automáticas",
    desc: "Saudação, fora do horário, confirmação e cobrança — texto pronto por tipo de negócio.",
  },
  {
    href: "https://www.ideiamultichat.com.br/solucoes/como-colocar-varios-atendentes-no-mesmo-numero-whatsapp",
    titulo: "Vários atendentes no mesmo WhatsApp",
    desc: "Quando o volume cresce: como a equipe inteira atende pelo mesmo número.",
  },
  {
    href: "https://www.ideiamultichat.com.br/solucoes/o-que-e-api-oficial-do-whatsapp-e-por-que-usar",
    titulo: "API Oficial do WhatsApp",
    desc: "O que é, quanto custa e por que é o único caminho autorizado para escalar.",
  },
];

export default function GeradorLinkPage() {
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
    name: "Gerador de link do WhatsApp",
    url: URL_CANONICA,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    publisher: { "@type": "Organization", name: "Ideia Chat", url: "https://www.ideiamultichat.com.br" },
  };

  return (
    <main className="bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />

      <GeradorLink />

      {/* FAQ */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
              <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
              Dúvidas
            </p>
            <h2 className="mt-3 font-ideia text-3xl font-black leading-tight text-slate-900 md:text-4xl">
              Perguntas frequentes
            </h2>
            <p className="mt-3 text-slate-600">
              O que mais aparece sobre link do WhatsApp — respondido direto.
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

      {/* leituras */}
      <section className="bg-surface-alt py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-ideia text-sm font-bold uppercase tracking-[0.18em] text-ideia-chat">
            <span className="mr-2 inline-block h-[3px] w-6 -translate-y-1 bg-ideia-chat align-middle" />
            Continue
          </p>
          <h2 className="mt-3 font-ideia text-3xl font-black leading-tight text-slate-900 md:text-4xl">
            Do link ao atendimento organizado
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
                  Abrir <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppFlutuante mensagem="Oi! Usei o gerador de link do WhatsApp do Ideia Chat e quero falar com o comercial." />

      <footer className="border-t border-border bg-white py-8 text-center text-xs text-text-subtle">
        Gerador de link do WhatsApp — uma ferramenta gratuita do{" "}
        <a href="https://www.ideiamultichat.com.br" className="font-semibold text-ideia-link hover:underline">
          Ideia Chat
        </a>
        , plataforma de atendimento WhatsApp desenvolvida pela Ideia Business.
      </footer>
    </main>
  );
}
