"use client";

import { useState } from "react";
import { PageCTA } from "@/components/ui/PageCTA";

type Billing = "mensal" | "anual";

const PLANS: Record<
  Billing,
  {
    name: string;
    description: string;
    price: string;
    priceNote: string;
    features: string[];
    ctaLabel: string;
    highlight?: boolean;
  }[]
> = {
  mensal: [
    {
      name: "Essencial",
      description: "Entrada ideal para equipes pequenas que precisam de API oficial e organização.",
      price: "179,90",
      priceNote: "por mês · cobrança mensal",
      features: [
        "Até 2 usuários simultâneos",
        "API oficial Meta (WhatsApp Business)",
        "Agente de IA e automações",
        "Filas e handoff humano",
      ],
      ctaLabel: "Demonstração gratuita",
    },
    {
      name: "Elite",
      description: "Para operações com mais volume e até 20 atendentes no mesmo número.",
      price: "489,00",
      priceNote: "por mês · cobrança mensal",
      features: [
        "Até 20 usuários",
        "Tudo do Essencial, com escala",
        "Omnichannel (Meta: WhatsApp, IG, FB)",
        "Suporte e onboarding alinhados ao plano",
      ],
      ctaLabel: "Demonstração gratuita",
      highlight: true,
    },
  ],
  anual: [
    {
      name: "Essencial",
      description: "Mesmos recursos do Essencial com condições de fatura anual negociáveis.",
      price: "179,90",
      priceNote: "base mensal · desconto anual com o comercial",
      features: [
        "Até 2 usuários simultâneos",
        "API oficial Meta",
        "IA e automações",
        "Condição de fatura anual na proposta",
      ],
      ctaLabel: "Demonstração gratuita",
    },
    {
      name: "Elite",
      description: "Elite com opção de compromisso anual e condições comerciais dedicadas.",
      price: "489,00",
      priceNote: "base mensal · desconto anual com o comercial",
      features: [
        "Até 20 usuários",
        "Escala e governance",
        "Omnichannel Meta",
        "Proposta comercial anual sob medida",
      ],
      ctaLabel: "Demonstração gratuita",
      highlight: true,
    },
  ],
};

function BillingToggle({
  value,
  onChange,
}: {
  value: Billing;
  onChange: (v: Billing) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1 bg-slate-100 ring-1 ring-slate-200/90 shadow-sm"
      role="group"
      aria-label="Tipo de cobrança"
    >
      {(
        [
          ["mensal", "Mensal"],
          ["anual", "Anual"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
            value === key
              ? "bg-white text-ideia-primary shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  paginaId,
  variacaoId,
  whatsappNumber,
}: {
  plan: (typeof PLANS)["mensal"][0];
  paginaId: string;
  variacaoId?: string;
  whatsappNumber: string;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl bg-white p-6 text-left shadow-md ring-1 ${
        plan.highlight
          ? "ring-2 ring-[var(--color-ideia-chat)] shadow-lg shadow-ideia-primary/10"
          : "ring-slate-200/90"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{plan.name}</p>
      <p className="mt-2 text-sm text-slate-600 leading-snug min-h-[2.75rem]">{plan.description}</p>
      <div className="mt-5 flex items-baseline gap-1 flex-wrap">
        <span className="text-slate-500 text-lg font-medium">R$</span>
        <span className="text-4xl md:text-5xl font-black tabular-nums text-[var(--color-ideia-chat-dark)] font-ideia">
          {plan.price}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{plan.priceNote}</p>
      <ul className="mt-6 flex flex-col gap-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ideia-chat)] text-white"
              aria-hidden
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2.5 6l2.5 2.5L9.5 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <PageCTA
          paginaId={paginaId}
          variacaoId={variacaoId}
          whatsappNumber={whatsappNumber}
          label={plan.ctaLabel}
          size="lg"
          buttonVariant="whatsapp"
          className="w-full justify-center rounded-xl font-bold shadow-md"
        />
      </div>
    </div>
  );
}

export function PricingAndDemoCta({
  paginaId,
  variacaoId,
  whatsappNumber,
}: {
  paginaId: string;
  variacaoId?: string;
  whatsappNumber: string;
}) {
  const [billing, setBilling] = useState<Billing>("mensal");
  const plans = PLANS[billing];

  return (
    <section
      id="demonstracao-gratuita"
      className="scroll-mt-24 border-y border-slate-200/90 bg-slate-50"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ideia-primary">Valores</p>
          <h2
            id="pricing-heading"
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black font-ideia leading-tight text-slate-900"
          >
            Conheça os planos
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
            Tabela de referência para você ter <strong className="font-semibold text-slate-800">ideia de
            investimento</strong> antes de falar com o time. Planos <strong>Profissional</strong> (intermediário) e{" "}
            <strong>Corporativo</strong> são tratados com proposta personalizada.
          </p>
          <div className="mt-6">
            <BillingToggle value={billing} onChange={setBilling} />
          </div>

          <div
            id="secao-valores"
            className="mt-8 grid w-full grid-cols-1 items-stretch gap-5 text-left sm:grid-cols-2 lg:gap-6"
          >
            {plans.map((p) => (
              <PlanCard
                key={`${p.name}-${billing}`}
                plan={p}
                paginaId={paginaId}
                variacaoId={variacaoId}
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
            Referência: abril/2026 · ideiapages/references/product_facts.md. Valores e condições comerciais finais
            confirmados na demonstração, conforme o seu cenário.
          </p>
        </div>
      </div>
    </section>
  );
}
