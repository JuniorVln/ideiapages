# Metodologia SDD do projeto IDeiaPages

> Documento de orientação. Lê isto **antes de pedir** "/spec", "/break", "/plan" ou "/execute" para entender exatamente em que nível você está operando.

---

## TL;DR (em 30 segundos)

SDD tem **4 camadas** de artefato. Cada camada responde uma pergunta diferente:


| Camada              | Pergunta                                    | Onde vive                   | Quem escreve                      |
| ------------------- | ------------------------------------------- | --------------------------- | --------------------------------- |
| **1. Constitution** | "Quais regras do projeto são imutáveis?"    | `references/*.md`           | Humano (Júnior + IA juntos, raro) |
| **2. Spec**         | "O QUE vamos construir nesta feature/fase?" | `specs/<fase>/<feature>.md` | `/spec` (humano + IA)             |
| **3. Plan**         | "COMO e em que ORDEM vamos construir?"      | `plans/<fase>/<feature>.md` | `/plan` (IA, validado por humano) |
| **4. Execute**      | "Codifica."                                 | código no repo + commits    | `/execute` → agente especialista  |


**Behavior** (ex: `collect-autocomplete`) NÃO é um item da camada 2. É um **módulo da arquitetura** que aparece nas camadas 3 e 4 como uma tarefa do plano.

---

## O que eu fiz errado nas últimas sessões

Criei **7 arquivos `behaviors/research/*/spec.md`**. Isso confundiu o nível das camadas:

- Tratei cada behavior como se fosse uma feature → **excesso de papel, zero código**
- A sensação correta é: *"escrevi 7 docs e ainda não tem nem uma tabela criada"*
- Você sentiu isso e está certo

O que esses arquivos **realmente são**: **contratos detalhados** dos módulos da Fase 0. Eles são úteis como referência durante o `/plan` e `/execute`, mas **não são specs no sentido SDD**.

### Correção (sem jogar fora trabalho)


| Antes                                   | Depois                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `behaviors/research/<behavior>/spec.md` | `behaviors/research/<behavior>/contract.md` (renomear) |
| (não existe)                            | `specs/fase-0-research-pipeline.md` (1 spec por fase)  |
| (não existe)                            | `plans/fase-0-research-pipeline.md` (1 plan por fase)  |
| Issues separadas para cada behavior     | Issues geradas pelo `/break` da spec única da fase     |


Vou aplicar essa correção quando você confirmar.

---

## As 4 camadas em detalhe

### Camada 1 — Constitution (`references/`)

Regras inquebráveis do projeto. Escritas uma vez, alteradas raramente, **lidas por todo agente** antes de gerar código.

Arquivos atuais:

- `architecture.md` — stack, monorepo, regras invioláveis
- `data_model.md` — schema canônico do banco
- `seo_rules.md` — regras de SEO (Information Gain, Schema, Quality Gate)
- `design_system.md` — paleta, tipografia, componentes
- `prompts_engineering.md` — padrões de prompt LLM
- `conversion_principles.md` — UX de conversão
- `product_facts.md` — fatos do Ideia Chat (anti-alucinação)
- `security_rules.md` — RLS, validação, LGPD

**Você não chama nenhum comando para essa camada.** Você edita os `.md` quando uma regra evoluir.

---

### Camada 2 — Spec (`specs/`)

Uma spec por **feature** ou **fase**. Descreve o **QUE** sem dizer **COMO**. Sem código, sem nome de arquivo, sem detalhe de implementação.

Estrutura recomendada do nosso projeto: **uma spec por fase do plano**.

```
specs/
  fase-0-research-pipeline.md    ← descobrir e priorizar termos
  fase-1-paginas-piloto.md       ← Next.js + 5-10 páginas
  fase-2-multi-ia-ab.md          ← geração multi-IA + A/B
  fase-3-dashboard.md            ← dashboard de performance
  fase-4-autocura.md             ← detecção de drop e regeneração
```

Cada spec responde:

- Objetivo da fase (1 parágrafo)
- Critérios de "feito" (lista verificável)
- Entradas (o que precisamos antes)
- Saídas (o que entregamos)
- Não-objetivos (o que NÃO faremos nesta fase)
- Riscos / decisões em aberto

**Comando**: `/spec <nome-da-fase>`

---

### Camada 3 — Plan (`plans/`)

Para cada spec aprovada, um plan diz **COMO** vamos chegar lá:

- Lista de issues sequenciais (cada uma com escopo de 1-3 horas)
- Para cada issue: arquivos exatos a criar/editar, agente responsável, dependências
- Ordem de execução (DAG)
- Estimativa de custo (R$ em LLM, créditos Apify, etc.)

**Comandos**: 

- `/break <spec>` → gera lista de issues sequenciais (alto nível)
- `/plan <issue>` → detalha COMO essa issue específica vai ser executada (arquivos, agente, contrato)

---

### Camada 4 — Execute (código real)

Para cada issue plan-ada, `/execute` invoca o **agente especialista** correto:

- `model-writer` → migrations Supabase + RLS + tipos
- `python-collector-writer` → código Python de coleta (Apify, Firecrawl, pytrends)
- `python-analyzer-writer` → código Python de análise (LLM, NLP)
- `component-writer` → componentes React do design system
- `seo-page-writer` → páginas Next.js com SEO
- `prompt-engineer` → templates de prompt em `references/prompts/`
- `quality-reviewer` → revisa output de outro agente

Cada agente tem `allowed_paths` e `read_only_paths` definidos em `.cursor/agents/*.md`.

**Comando**: `/execute <issue>`

---

## Mapa de pastas (onde cada coisa mora)

```
ideiapages/
├── .cursor/
│   ├── commands/      ← definições dos slash commands /spec /break /plan /execute
│   ├── agents/        ← agentes especialistas e seus permissões
│   └── rules/         ← rules globais Cursor
├── references/        ← Camada 1 — Constitution
├── specs/             ← Camada 2 — UMA por fase  (a criar)
├── plans/             ← Camada 3 — UM por fase   (a criar)
├── behaviors/         ← arquitetura de código por behavior (Camada 4 organizacional)
│   └── research/
│       ├── README.md
│       ├── data-model/
│       │   └── contract.md   ← (renomear de spec.md)
│       ├── collect-autocomplete/
│       │   └── contract.md
│       └── ...
├── research/          ← projeto Python (collectors + analyzers)
├── web/               ← projeto Next.js
├── supabase/          ← migrations SQL
├── seeds/             ← dados de entrada
└── docs/
    ├── sdd-workflow.md
    └── metodologia-sdd.md  ← este arquivo
```

---

## Caminho recomendado a partir de AGORA

### Passo imediato (faz progresso real, gera código)

1. **Renomeio** os 7 `spec.md` para `contract.md` e crio 1 spec única para a Fase 0 (15 min, só reorganização):
  ```
   specs/fase-0-research-pipeline.md   ← spec real da fase
   behaviors/research/*/contract.md    ← contratos detalhados (já escritos)
  ```
2. `**/plan` direto na primeira issue concreta**: criar as tabelas Supabase (`data-model`).
  - Agente: `model-writer`
  - Output esperado: `supabase/migrations/0001_termos.sql`, `0002_serp.sql`, etc.
  - Tempo: ~1h
  - Ao final: você roda `supabase db push` e tem **schema real no banco**.
3. `**/execute`** dessa issue → tabelas no Supabase, tipos TS gerados.
4. Próxima issue: `collect-autocomplete` → código Python que coleta de verdade.
5. Etc.

### O que isso muda na sua sensação de progresso

Hoje:

> "Tenho 7 docs longos e nada rodando."

Em 1-2 horas após este passo:

> "Tenho schema no Supabase, posso ver as tabelas, posso fazer insert/select."

Em 1 dia:

> "Tenho `collect-autocomplete` rodando: passei 1 seed e 30 termos novos apareceram no banco."

---

## Checklist de progresso (use como dashboard mental)

### Fase 0 — Research Pipeline

- Constitution escrita (`references/*.md`)
- Comandos `/spec /break /plan /execute` definidos (`.cursor/commands/`)
- Agentes especialistas definidos (`.cursor/agents/`)
- Contratos dos 7 behaviors escritos (`behaviors/research/*/`)
- **Spec única da Fase 0** (`specs/fase-0-research-pipeline.md`) — falta
- **Schema no Supabase** (issue 1: `data-model`) — falta
- `collect-autocomplete` implementado e rodado em 1 seed real
- `collect-trends` implementado e rodado em 10 keywords
- `classify-terms` implementado e rodado em 30 termos
- `collect-serp` implementado e rodado em 10 termos priorizados
- `scrape-competitors` implementado e rodado em 5 termos
- `analyze-gaps` implementado e gerando 5 briefings
- Relatório final da Fase 0 apresentado a você → aprovação para Fase 1

---

## Decisões em aberto (preciso da sua resposta)

1. **Confirma a correção?** Renomear `behaviors/research/*/spec.md` → `contract.md` e criar `specs/fase-0-research-pipeline.md` resumido?
2. **Pula o `/break`?** Como já temos 7 contratos detalhados, podemos ir direto do plan da fase para o `/plan` da primeira issue (`data-model`). Faz sentido?
3. **Quer ver código rodando hoje?** Se sim, foco total em `data-model` → migrations → push pro Supabase. Sem mais docs até as tabelas existirem.

