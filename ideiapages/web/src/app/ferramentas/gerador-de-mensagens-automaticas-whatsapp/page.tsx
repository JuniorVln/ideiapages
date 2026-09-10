import type { Metadata } from "next";
import Link from "next/link";
import { GeradorMensagens } from "./GeradorMensagens";

/**
 * Ferramenta-isca (autorizada pelo Victor em 12/08/2026).
 * Alvo do GATE de 10/09: cluster "mensagem automática whatsapp" (~100 mil buscas/mês no Brasil).
 * Roda 100% no cliente — nenhum dado do visitante é enviado ou guardado.
 */

const URL_CANONICA =
  "https://pages.ideiabusiness.com.br/ferramentas/gerador-de-mensagens-automaticas-whatsapp";

export const metadata: Metadata = {
  title: "Gerador de mensagens automáticas para WhatsApp (grátis)",
  description:
    "Gere mensagens automáticas de WhatsApp prontas para copiar: saudação, menu de setores, fora do horário, confirmação, lembrete e pós-atendimento — por tipo de negócio. Grátis e sem cadastro.",
  alternates: { canonical: URL_CANONICA },
  openGraph: {
    title: "Gerador de mensagens automáticas para WhatsApp (grátis)",
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

      <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ideia-chat">
          Ferramenta gratuita · Ideia Chat
        </p>
        <h1 className="mt-3 font-display text-4xl font-black leading-tight text-text sm:text-5xl">
          Gerador de mensagens automáticas para WhatsApp
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-muted">
          Escolha o tipo de mensagem e o seu ramo, ajuste o nome da empresa e copie o texto pronto.
          São modelos de <strong className="text-text">saudação, menu de setores, fora do horário,
          confirmação, lembrete, orçamento e pós-atendimento</strong> — escritos para soarem como
          empresa, não como robô. Grátis, sem cadastro e sem enviar nada do que você digita.
        </p>

        <GeradorMensagens />

        <section className="mt-16">
          <h2 className="font-display text-2xl font-black text-text sm:text-3xl">
            Perguntas frequentes
          </h2>
          <dl className="mt-6 space-y-6">
            {FAQ.map((f) => (
              <div key={f.pergunta} className="border-b border-border pb-6 last:border-0">
                <dt className="text-lg font-semibold text-text">{f.pergunta}</dt>
                <dd className="mt-2 leading-relaxed text-text-muted">{f.resposta}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14 rounded-2xl border border-border bg-surface-alt p-6">
          <h2 className="font-display text-xl font-black text-text">Continue lendo</h2>
          <ul className="mt-4 space-y-2 text-[15px]">
            <li>
              <Link
                href="https://www.ideiamultichat.com.br/solucoes/o-que-e-api-oficial-do-whatsapp-e-por-que-usar"
                className="text-ideia-link hover:underline"
              >
                API Oficial do WhatsApp: o que é, quanto custa e como contratar
              </Link>
            </li>
            <li>
              <Link
                href="https://www.ideiamultichat.com.br/solucoes/como-colocar-varios-atendentes-no-mesmo-numero-whatsapp"
                className="text-ideia-link hover:underline"
              >
                Vários atendentes no mesmo WhatsApp: como funciona o multiatendimento
              </Link>
            </li>
            <li>
              <Link
                href="https://www.ideiamultichat.com.br/solucoes/sistema-de-atendimento-whatsapp-para-empresas"
                className="text-ideia-link hover:underline"
              >
                Plataforma de atendimento WhatsApp para empresas
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
