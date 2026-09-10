"use client";

import { useMemo, useState } from "react";
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

export function GeradorMensagens() {
  const [categoria, setCategoria] = useState<CategoriaId>("saudacao");
  const [segmento, setSegmento] = useState<SegmentoId>("geral");
  const [empresa, setEmpresa] = useState("");
  const [horario, setHorario] = useState("");
  const [copiada, setCopiada] = useState<number | null>(null);

  const mensagens = useMemo(() => {
    return gerar(categoria, segmento).map((m) =>
      aplicarVariaveis(m, { empresa, horario }),
    );
  }, [categoria, segmento, empresa, horario]);

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

  return (
    <div className="mt-10">
      {/* controles */}
      <div className="rounded-2xl border border-border bg-surface-alt p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text">
              1. Que tipo de mensagem você precisa?
            </span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaId)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text outline-none focus:border-border-focus"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text">
              2. Qual é o seu tipo de negócio?
            </span>
            <select
              value={segmento}
              onChange={(e) => setSegmento(e.target.value as SegmentoId)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text outline-none focus:border-border-focus"
            >
              {SEGMENTOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text">
              3. Nome da empresa <span className="font-normal text-text-subtle">(opcional)</span>
            </span>
            <input
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Ex.: Contabilidade Vértice"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text outline-none placeholder:text-text-subtle focus:border-border-focus"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text">
              4. Horário de atendimento <span className="font-normal text-text-subtle">(opcional)</span>
            </span>
            <input
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="Ex.: de segunda a sexta, das 8h às 18h"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text outline-none placeholder:text-text-subtle focus:border-border-focus"
            />
          </label>
        </div>
        {catAtual && (
          <p className="mt-4 text-sm text-text-muted">
            <span className="font-semibold text-text">{catAtual.nome}:</span> {catAtual.descricao}
          </p>
        )}
      </div>

      {/* resultados */}
      <div className="mt-8 space-y-4">
        {mensagens.map((m, i) => (
          <article
            key={i}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full bg-surface-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Modelo {i + 1}
              </span>
              <button
                type="button"
                onClick={() => copiar(m, i)}
                className="shrink-0 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                {copiada === i ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-text">
              {m}
            </pre>
          </article>
        ))}
      </div>

      <p className="mt-6 text-sm text-text-muted">
        Os trechos entre chaves — <code className="rounded bg-surface-card px-1.5 py-0.5">{"{nome}"}</code>,{" "}
        <code className="rounded bg-surface-card px-1.5 py-0.5">{"{empresa}"}</code>,{" "}
        <code className="rounded bg-surface-card px-1.5 py-0.5">{"{horario}"}</code> e{" "}
        <code className="rounded bg-surface-card px-1.5 py-0.5">{"{atendente}"}</code> — são preenchidos
        automaticamente quando a mensagem sai de uma plataforma de atendimento. No WhatsApp Business você
        troca na mão antes de salvar.
      </p>

      {/* CTA */}
      <section className="mt-12 rounded-2xl bg-brand-dark px-6 py-10 text-center sm:px-10">
        <h2 className="font-display text-2xl font-black text-white sm:text-3xl">
          Copiar e colar resolve hoje. E amanhã?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-300">
          No aplicativo do WhatsApp Business essas mensagens são fixas, valem para uma pessoa em um
          aparelho e não sabem quem é o cliente. No <strong className="text-white">Ideia Chat</strong>,
          elas viram atendimento de verdade: saudação e menu de setores direcionando para a fila certa,
          resposta fora do horário, lembrete automático — com vários atendentes no mesmo número, agente de
          IA e API Oficial da Meta.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener"
            className="rounded-xl bg-brand-cta px-6 py-3 font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            Falar com um especialista
          </a>
          <a
            href="https://www.ideiamultichat.com.br/solucoes/sistema-de-atendimento-whatsapp-para-empresas"
            className="rounded-xl border border-neutral-600 px-6 py-3 font-semibold text-white transition hover:border-neutral-400"
          >
            Ver a plataforma de atendimento
          </a>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          Teste grátis por 7 dias, sem cartão · +400 empresas usam o Ideia Chat
        </p>
      </section>
    </div>
  );
}
