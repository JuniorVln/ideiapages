# Roadmap IDeiaPages

> Lista única e oficial de tarefas do projeto. Atualizada toda vez que algo é concluído.
> Para detalhes da metodologia que governa cada item, ver `[docs/sdd-workflow.md](./docs/sdd-workflow.md)`.

---

## Status atual

- **Marco em andamento**: **Fase 1 — Páginas Piloto** (Fase 0 **encerrada** em 22/04/2026).
- **Aprovação Fase 0**: **assinada** em `[FASE-0-APROVACAO.md](./FASE-0-APROVACAO.md)` — 19 briefings prontos (meta 20 flexibilizada pelo Júnior).
- **Próxima ação concreta**: Fase 1 — escrever **`f1-contracts`** (`behaviors/web/**/contract.md`), depois **`f1-impl-tables`** (migrations `paginas`, `variacoes`, `leads`, `metricas_diarias`). O `/break` consolidado já está em `specs/fase-1-paginas-piloto.break.md`.
- **Bloqueios**: nenhum.
- **Última atualização**: 2026-04-23 (Canvas + ROADMAP: Fase 0 fechada no Canvas; status Fase 1 contracts/break).

---

## Resumo por marco


| Marco                      | Total  | Concluídas | Em andamento | Pendentes |
| -------------------------- | ------ | ---------- | ------------ | --------- |
| Bootstrap SDD              | 1      | 1          | 0            | 0         |
| Fase 0 — Research Pipeline | 14     | 14         | 0            | 0         |
| Fase 1 — Páginas Piloto    | 11     | 2          | 0            | 9         |
| Fase 2 — Multi-IA + A/B    | 9      | 1          | 0            | 8         |
| Fase 3 — Dashboard         | 6      | 1          | 0            | 5         |
| Fase 4 — Autocura + Escala | 7      | 1          | 0            | 6         |
| **TOTAL**                  | **48** | **20**     | **0**        | **28**    |


Progresso geral: **42%** (20 de 48) — *Fase 0 encerrada; Fase 1: spec + break consolidado OK; falta contratos `behaviors/web` e implementação.*

---

## Bootstrap SDD

- **bootstrap** — Bootstrap SDD: references, .cursor/commands, .cursor/agents, estrutura de pastas

---

## Fase 0 — Research Pipeline

> **Entregável**: 20-50 termos com briefing SEO pronto para a Fase 1 gerar páginas.
> **Spec**: `[specs/fase-0-research-pipeline.md](./specs/fase-0-research-pipeline.md)`
>
> **Fluxo CLI (ordem)**: `collect-autocomplete` → `classify-terms` → *(opc.)* `collect-trends` → `prioritize-terms` → `collect-serp` → `scrape-competitors` → `analyze-gaps` → *(opc.)* `report`. Diagnóstico a qualquer momento: `fase-0-status`. Atalho: `run-pipeline --seed-file …`.

- **f0-spec** — Spec da fase: `specs/fase-0-research-pipeline.md`
- **f0-contracts** — 7 contratos dos behaviors de research (data-model, autocomplete, serp, scrape, trends, classify, analyze-gaps)
- **f0-break** — `/break fase-0-research-pipeline`: 25 issues + DAG global em `[specs/fase-0-research-pipeline.break.md](./specs/fase-0-research-pipeline.break.md)`
- **f0-impl-data-model** — Implementar data-model (migrations 0001–0006 + tipos TS; Supabase IdeiaPages)
- **f0-impl-autocomplete** — Implementar collect-autocomplete (actors Apify + CLI + métricas)
- **f0-impl-trends** — Implementar collect-trends (pytrends + CLI + JSONB `tendencia_pytrends`)
- **f0-impl-classify** — Implementar classify-terms (Claude Haiku + CLI + Supabase)
- **f0-impl-serp** — Implementar collect-serp (Apify SERP top 10 + CLI)
- **f0-impl-scrape** — Implementar scrape-competitors (Firecrawl + CLI)
- **f0-impl-gaps** — Implementar analyze-gaps (Claude Sonnet + `briefings_seo` + CLI)
- **f0-impl-orchestration** — CLI `run-pipeline`, `prioritize-terms`, `report`, `**fase-0-status`**; prompt `references/prompts/analyze-gaps.md`; pacote `behaviors/pipeline/`
- **f0-pipeline-run** ✅ Executado E2E; estado final: 56 termos, **19 `briefing_pronto`**, 19 em `briefings_seo`
- **f0-report** ✅ Relatório gerado em `research/data/relatorios/fase-0-20260422T200956Z.md` (com nota de aprovação)
- **f0-aprovacao** ✅ **Aprovado pelo Júnior em 22/04/2026 com 19 briefings** (meta 20 flexibilizada) — ver `[FASE-0-APROVACAO.md](./FASE-0-APROVACAO.md)`

---

## Fase 1 — Páginas Piloto

> **Entregável**: 5-10 páginas SEO publicadas em `ideiamultichat.com.br/blog` capturando leads.
> **Pré-requisito**: Fase 0 aprovada.
> **Spec**: `[specs/fase-1-paginas-piloto.md](./specs/fase-1-paginas-piloto.md)`

- **f1-spec** — Spec da fase: `specs/fase-1-paginas-piloto.md` **(concluída 2026-04-22)**
- **f1-contracts** — **Pendente.** Ainda não existem `behaviors/web/**/contract.md` (só há contratos da Fase 0 em `behaviors/research/*`). Próximo passo: criar contratos por domínio (data-model, design, rendering, conversion, monitoring, generation) conforme a spec.
- **f1-break** ✅ **Arquivo consolidado** `[specs/fase-1-paginas-piloto.break.md](./specs/fase-1-paginas-piloto.break.md)`: DAG + **22 issues** detalhadas. *Opcional (paridade Fase 0):* espelhar em `behaviors/web/.../issues/*.md` — ainda **não** criado.
- **f1-impl-tables** — Migrations: tabelas paginas, variacoes, leads, metricas_diarias
- **f1-impl-design** — Design system base (Tailwind tokens + componentes UI base: Button, Form, Modal)
- **f1-impl-rendering** — Behaviors de rendering: render-page (Next.js dinâmica), schema.org, sitemap, robots
- **f1-impl-conversion** — Behaviors de conversion: lead-form-submit, whatsapp-modal, utm-tracking
- **f1-impl-tracking** — Behaviors de tracking: GA4 events, GSC integration, conversion tracking
- **f1-piloto-deploy** — Deploy 5-10 páginas piloto em `ideiamultichat.com.br/blog` (proxy reverso Vercel)
- **f1-validacao** — Coletar 2 semanas de dados (CTR, leads, ranking) e validar funil
- **f1-aprovacao** — Aprovação do Júnior (taxa de conversão ≥ 1%) → libera Fase 2

---

## Fase 2 — Multi-IA + A/B Testing

> **Entregável**: 20-50 páginas geradas por Claude/GPT/Gemini com A/B ativo, vencedor definido por significância estatística.
> **Pré-requisito**: Fase 1 aprovada.
> **Spec**: `[specs/fase-2-multi-ia-ab.md](./specs/fase-2-multi-ia-ab.md)`

- **f2-spec** — Spec da fase: `specs/fase-2-multi-ia-ab.md` **(concluída 2026-04-22)**
- **f2-contracts** — Contratos: generation (claude-generator, gpt-generator, gemini-generator, quality-gate), experiments (assign-variation, track-metrics, declare-winner)
- **f2-break** — `/break fase-2-multi-ia-ab`: issues + DAG
- **f2-impl-prompts** — Prompt engineering: templates versionados em `references/prompts/` (generate-page por intent)
- **f2-impl-generators** — Implementar 3 generators: claude-generator, gpt-generator, gemini-generator
- **f2-impl-quality-gate** — Implementar quality-gate (valida SEO + factual + design system + product_facts)
- **f2-impl-experiments** — Implementar A/B: assign-variation, track-metrics, declare-winner (significância estatística)
- **f2-expansao** — Gerar e publicar 20-50 páginas com A/B ativo entre as 3 IAs
- **f2-aprovacao** — Aprovação do Júnior (winner statistically significant + ROI positivo) → libera Fase 3

---

## Fase 3 — Dashboard

> **Entregável**: dashboard interno mostrando performance por página/IA/cluster + recomendações automáticas.
> **Pré-requisito**: Fase 2 aprovada.
> **Spec**: `[specs/fase-3-dashboard.md](./specs/fase-3-dashboard.md)`

- **f3-spec** — Spec da fase: `specs/fase-3-dashboard.md` **(concluída 2026-04-22)**
- **f3-contracts** — Contratos: dashboard (performance-view, recommendations-engine)
- **f3-break** — `/break fase-3-dashboard`: issues + DAG
- **f3-impl-dashboard** — Dashboard interno: performance por página, por IA, por cluster, custo vs ROI
- **f3-impl-recommendations** — Engine de recomendações (próximas páginas a criar, candidatos a A/B refresh)
- **f3-aprovacao** — Aprovação do Júnior → libera Fase 4

---

## Fase 4 — Autocura + Escala

> **Entregável**: monitoramento contínuo de ranking + reescrita automática de páginas em queda + 100+ páginas no ar.
> **Pré-requisito**: Fase 3 aprovada.
> **Spec**: `[specs/fase-4-autocura.md](./specs/fase-4-autocura.md)`

- **f4-spec** — Spec da fase: `specs/fase-4-autocura.md` **(concluída 2026-04-22)**
- **f4-contracts** — Contratos: monitoring (detect-ranking-drop, auto-rewrite, scale-orchestrator)
- **f4-break** — `/break fase-4-autocura`: issues + DAG
- **f4-impl-detect** — Behavior detect-ranking-drop (GSC polling + alerta de queda)
- **f4-impl-rewrite** — Behavior auto-rewrite (re-snapshot SERP → re-analyze gaps → regenerar página)
- **f4-escala** — Escalar para 100+ páginas com monitoramento automático
- **f4-final** — Aprovação final do projeto (autocura validada + escala provada)

---

## Como funciona

### Quem atualiza este arquivo

- **A IA (eu)** atualiza este arquivo a cada tarefa concluída, junto com a lista efêmera do chat.
- **Você (Júnior)** pode marcar manualmente também — basta trocar `[ ]` por `[x]`.

### Convenção de status

- `[ ]` = pendente
- `[ ] ... *(em andamento)`* = uma tarefa por vez em andamento
- `[x]` = concluída
- `~~[x] tarefa~~` = cancelada (com riscado)

### Canvas (Cursor)

- **Acompanhamento visual** (lista por fase, mesma informação do roadmap): arquivo gerido pelo Cursor em  
`.cursor/projects/c-Users-junio-Projects-Rede-Ideia/canvases/ideiapages-roadmap.canvas.tsx`  
(abrir ao lado do chat). **Atualizar sempre em conjunto** com este `ROADMAP.md`.

### Onde vivem os artefatos de cada tarefa

- **Spec da fase** → `specs/<fase>.md`
- **Contratos** → `behaviors/<dominio>/<behavior>/contract.md`
- **Issues geradas pelo /break** → `behaviors/<dominio>/<behavior>/issues/NN-*.md`
- **Plans gerados pelo /plan** → `behaviors/<dominio>/<behavior>/issues/NN-*-plan.md`
- **Código real** → `web/`, `research/`, `supabase/`

### Como acompanhar diariamente

1. Abre `ideiapages/ROADMAP.md` no Cursor
2. Lê a seção "Status atual" (3 primeiras linhas)
3. Olha o resumo por marco (1 tabela)
4. Encontra a tarefa atual em andamento — sabe o que está acontecendo
5. Vê quantas faltam até a próxima aprovação

---

## Histórico de aprovações de fase

> Esta seção é preenchida quando uma fase é aprovada pelo Júnior, com data e link para o relatório.

- *(nenhuma fase aprovada ainda)*

---

## Histórico técnico (changelog resumido)


| Data       | Nota                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-20 | Fase 0: implementados `analyze-gaps`, `run-pipeline`, `prioritize-terms`, `report`; ROADMAP alinhado ao fluxo SERP → scrape → gaps. |
| 2026-04-22 | Criados specs das Fases 1–4: `fase-1-paginas-piloto.md`, `fase-2-multi-ia-ab.md`, `fase-3-dashboard.md`, `fase-4-autocura.md`.      |
