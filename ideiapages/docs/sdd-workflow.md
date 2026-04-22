# Spec-Driven Development — Como Trabalhar no IDeiaPages

> Manual prático do workflow SDD adaptado para este projeto.

---

## TL;DR

Toda mudança no projeto passa por **4 camadas** de artefato. Cada camada responde uma pergunta diferente:

```
1. Constitution   →  references/*.md           "Quais regras são imutáveis?"
2. /spec <fase>   →  specs/<fase>.md           "O QUÊ vamos construir nesta fase?"
3. /plan ...      →  behaviors/.../NN-plan.md  "COMO e em que ORDEM?"
4. /execute ...   →  código real + commits     "Codifica."
```

E **sempre** com `references/` lida pelo agente antes de gerar qualquer linha.

> **Observação importante**: `behavior` (ex: `collect-autocomplete`) NÃO é um item da camada 2 — é um **módulo de código** que aparece nas camadas 3 e 4 como tarefa. Ver "Os 4 níveis de granularidade" abaixo.

---

## Por que SDD aqui

IDeiaPages tem dezenas de comportamentos diferentes (research, generation, conversion, A/B, autocura). Sem isolamento:

- Mudar geração quebra captura de leads
- Mudar form quebra A/B
- Cada feature nova exige reler todo o codebase

Com behavior-oriented isolation:

- Cada behavior tem sua pasta, seu contrato, suas issues, seu código
- LLM recebe escopo curto → mais qualidade, menos retrabalho
- Refactor de uma feature não afeta outras

---

## Os 4 níveis de granularidade


| Camada              | Pergunta            | Onde vive                                            | Granularidade             | Quem escreve          |
| ------------------- | ------------------- | ---------------------------------------------------- | ------------------------- | --------------------- |
| **1. Constitution** | "Regras imutáveis?" | `references/*.md`                                    | 1 arquivo por tema        | Humano (raro)         |
| **2. Spec**         | "O QUÊ?"            | `specs/<fase>.md`                                    | **1 por fase do projeto** | `/spec` (humano + IA) |
| **3. Plan**         | "COMO?"             | `behaviors/<dominio>/<behavior>/issues/NN-*-plan.md` | **1 por sub-tarefa**      | `/plan` (IA validada) |
| **4. Execute**      | "Codifica."         | código real                                          | 1 commit por tarefa       | `/execute` → agente   |


### Nota sobre `/break`

`/break <fase>` decompõe a spec da fase numa sequência de issues — **uma por behavior** dessa fase. Cada issue vira o input do `/plan`.

---

## Domínios e behaviors

**Domínio** = bucket temático grande. **Behavior** = módulo isolado de código dentro de um domínio.


| Domínio       | O que mora aqui                  | Exemplos de behaviors                                          |
| ------------- | -------------------------------- | -------------------------------------------------------------- |
| `research`    | Coleta e análise de termos       | `collect-autocomplete`, `scrape-competitors`, `classify-terms` |
| `generation`  | Geração de conteúdo com LLMs     | `claude-generator`, `quality-gate`                             |
| `rendering`   | Renderização de páginas públicas | `render-blog-post`, `render-landing-page`                      |
| `conversion`  | Captura de leads                 | `lead-form-submit`, `whatsapp-modal`, `utm-tracking`           |
| `experiments` | Teste A/B                        | `assign-variation`, `track-metrics`, `declare-winner`          |
| `monitoring`  | Autocura e escala                | `detect-ranking-drop`, `auto-rewrite`                          |


---

## Sintaxe dos argumentos: comando → argumento → output

Tabela única de referência. Cada linha mostra exatamente o que o comando recebe e o que produz no disco.


| Comando    | Argumento                                                                      | O que cria                                               | Granularidade            |
| ---------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------ |
| `/spec`    | `<fase>` ex: `fase-0-research-pipeline`                                        | `specs/<fase>.md`                                        | 1 spec por fase          |
| `/break`   | `<fase>` ex: `fase-0-research-pipeline`                                        | `behaviors/<dominio>/<behavior>/issues/NN-*.md` (várias) | N issues, 1 por behavior |
| `/plan`    | `<dominio>/<behavior>/<NN-issue>` ex: `research/collect-autocomplete/01-types` | `behaviors/<dominio>/<behavior>/issues/NN-*-plan.md`     | 1 plan por sub-tarefa    |
| `/execute` | `<dominio>/<behavior>/<NN-issue>` ex: `research/collect-autocomplete/01-types` | código real nos paths listados no plan                   | 1 commit                 |


**Resumo visual da hierarquia do argumento**:

```
fase-0-research-pipeline                                         ← /spec, /break
└── research/                          (domínio)
    └── collect-autocomplete/          (behavior)                ← arquitetura
        └── 01-types-zod-schema        (issue dentro do behavior) ← /plan, /execute
```

---

## Pipeline detalhado

### 1. `/spec <fase>`

Cria `specs/<fase>.md` — **uma única spec para a fase inteira**.

A spec descreve:

- Objetivo da fase (1 parágrafo)
- Triggers (gatilhos do usuário/sistema) que essa fase atende
- Comportamentos de alto nível esperados ao final da fase
- Entradas (o que precisa estar pronto antes)
- Saídas (o que a fase entrega)
- Critérios de "feito" (verificáveis no fim)
- Não-objetivos (o que NÃO faremos nesta fase)
- Riscos / decisões em aberto

**Exemplo**: `specs/fase-0-research-pipeline.md` cobre todos os 7 behaviors do domínio research.

A spec **não menciona arquivos, paths nem tecnologia específica**. É comportamento puro.

### 2. `/break <fase>`

Decompõe a spec da fase numa lista de **issues sequenciais**, geralmente uma por behavior, criando arquivos em `behaviors/<dominio>/<behavior>/issues/`.

**Regra de ouro**: backend foundation primeiro (schema, tipos, contratos), depois UI/feature, depois polish.

Ordem típica dentro de cada behavior:

1. `01-types-contracts.md` — schemas zod / pydantic, contratos
2. `02-migration.md` — schema Supabase (se houver)
3. `03-server-logic.md` — route handler / Python collector
4. `04-stub-ui.md` — componente sem lógica (se houver UI)
5. `05-wire-up.md` — UI fala com server
6. `06-validation.md` — caminho feliz E2E
7. `07-edge-cases.md` — erros, race conditions
8. `08-polish.md` — loading, empty, mensagens

Cada issue: completável em 1-2h.

### 3. `/plan <dominio>/<behavior>/<NN-nome>`

O passo MAIS CRÍTICO. Cria `<NN-nome>-plan.md`.

O plano:

- Lista componentes reutilizáveis encontrados (RAG no codebase)
- Lista componentes a criar
- **Lista exata de arquivos** que serão modificados
- Lista arquivos que NÃO podem ser tocados
- Mudanças no banco (se houver)
- APIs externas chamadas
- Como testar
- Riscos
- **Define qual agente especialista vai executar**

Sem plano detalhado, NÃO executar.

### 4. `/execute <dominio>/<behavior>/<NN-nome>`

O orquestrador (Cursor) lê o plan, identifica o agente correto e invoca.

O agente:

- Modifica APENAS os arquivos listados
- Lê references/ relevantes
- Faz lint/typecheck antes de marcar done
- Atualiza issue com `status: done`

Se precisar tocar fora do escopo, **PARA** e devolve para o orquestrador.

---

## Exemplo end-to-end (Fase 0)

Acompanhar um caminho real do projeto, do `/spec` até o código rodando.

### Cenário

Vamos descobrir e priorizar termos de SEO para o nicho Ideia Chat.

### Passo 1 — `/spec fase-0-research-pipeline`

```
Cria: specs/fase-0-research-pipeline.md
Conteúdo: o que a fase entrega (20-50 termos com briefing pronto), critérios de feito, não-objetivos.
NÃO menciona: Supabase, Apify, Python, arquivos.
```

### Passo 2 — `/break fase-0-research-pipeline`

```
Cria: várias issues, agrupadas por behavior:

behaviors/research/data-model/issues/
  01-create-termos-table.md
  02-create-serp-snapshots.md
  03-create-conteudo-concorrente.md
  04-rls-and-types.md

behaviors/research/collect-autocomplete/issues/
  01-types-pydantic.md
  02-apify-client.md
  03-cli-command.md
  04-validation.md

behaviors/research/collect-trends/issues/
  ... etc

(continua para os demais behaviors)
```

Cada issue: 1-2h, dependência explícita.

### Passo 3 — `/plan research/data-model/01-create-termos-table`

```
Lê: spec da fase + issue + references/data_model.md + codebase atual
Cria: behaviors/research/data-model/issues/01-create-termos-table-plan.md

Conteúdo do plan:
  agent: model-writer
  estimated_minutes: 30
  Arquivos a criar:
    - supabase/migrations/0001_termos.sql
  Arquivos a regenerar:
    - web/src/lib/database.types.ts
  Arquivos que NÃO podem ser tocados:
    - todo o restante
```

### Passo 4 — `/execute research/data-model/01-create-termos-table`

```
Orquestrador invoca: agente model-writer
Agente faz:
  1. Lê references/data_model.md e references/security_rules.md
  2. Escreve supabase/migrations/0001_termos.sql (CREATE TABLE + RLS)
  3. Roda supabase db push (ou manda SQL para você rodar)
  4. Roda pnpm db:types para regenerar database.types.ts
  5. Atualiza issue: status: done

Resultado: tabela `termos` existe no Supabase. Você pode abrir o Studio e ver.
```

Próxima issue: `02-create-serp-snapshots`. E assim por diante até a fase fechar.

---

## Agentes especialistas

Cada um é um expert numa camada. Veja `.cursor/agents/`:


| Agente                    | Camada                                   |
| ------------------------- | ---------------------------------------- |
| `model-writer`            | SQL Supabase + RLS                       |
| `python-collector-writer` | Coleta Python (Apify/Firecrawl/pytrends) |
| `python-analyzer-writer`  | Análise Python (LLM)                     |
| `component-writer`        | Componentes React isolados               |
| `seo-page-writer`         | Páginas Next.js com SEO completo         |
| `prompt-engineer`         | Templates de prompt versionados          |
| `quality-reviewer`        | Auditoria read-only                      |


Cada agente tem `allowed_paths` explícitos. Não escapa do seu domínio.

---

## Knowledge base (`references/`)

São 8 arquivos lidos por TODO agente antes de gerar código:


| Arquivo                    | Quando ler                |
| -------------------------- | ------------------------- |
| `architecture.md`          | sempre                    |
| `security_rules.md`        | sempre                    |
| `design_system.md`         | UI / componentes          |
| `seo_rules.md`             | páginas Next.js públicas  |
| `data_model.md`            | banco / migrations        |
| `conversion_principles.md` | forms / CTAs / leads      |
| `prompts_engineering.md`   | LLMs                      |
| `product_facts.md`         | conteúdo sobre Ideia Chat |


Quando algo na knowledge base muda, comunicar via commit (`docs:`) e revisar behaviors afetados.

---

## Estrutura de pastas

```
ideiapages/
├── .cursor/
│   ├── commands/    spec, break, plan, execute (slash commands)
│   ├── agents/      7 agentes
│   └── rules/       always-read-references
├── references/      knowledge base (Camada 1 — Constitution)
├── specs/           1 spec por fase (Camada 2)
│   ├── fase-0-research-pipeline.md
│   ├── fase-1-paginas-piloto.md
│   ├── fase-2-multi-ia-ab.md
│   ├── fase-3-dashboard.md
│   └── fase-4-autocura.md
├── behaviors/       contratos + issues + plans por comportamento (Camadas 3-4)
│   ├── research/
│   │   └── collect-autocomplete/
│   │       ├── contract.md           (contrato detalhado do behavior)
│   │       └── issues/
│   │           ├── 01-types.md       (do /break)
│   │           ├── 01-types-plan.md  (do /plan)
│   │           ├── 01-types-review.md (se quality-reviewer rodou)
│   │           └── ...
│   ├── generation/
│   ├── rendering/
│   ├── conversion/
│   ├── experiments/
│   └── monitoring/
├── research/        Python (implementação)
│   └── src/ideiapages_research/
│       └── behaviors/
│           └── collect_autocomplete/   (snake_case no Python)
│               ├── collectors/
│               └── analyzers/
├── web/             Next.js (implementação)
│   └── src/
│       ├── app/
│       └── behaviors/
│           ├── conversion/
│           │   └── lead-form-submit/
│           │       ├── components/
│           │       ├── hooks/
│           │       └── server/
│           └── ...
├── supabase/
│   └── migrations/
└── docs/            (este arquivo)
```

---

## Anti-padrões

❌ **Pular `/spec`** porque "é só uma mudança pequena".  
✅ Toda mudança tem spec, mesmo que mínima.

❌ **Criar componente em `web/src/components/`** quando ele é específico de um behavior.  
✅ Componentes específicos vão em `web/src/behaviors/<X>/<Y>/components/`.

❌ **Importar `from "@/behaviors/conversion/.../components/Form"` em outro behavior.**  
✅ Compartilhar via tipos em `lib/types/` ou via API HTTP.

❌ **Editar `database.types.ts` à mão.**  
✅ Sempre regenerar via `supabase gen types`.

❌ **Comentar "// imports" ou "// helper function".**  
✅ Sem comentário narrativo. Apenas intenção não óbvia.

---

## FAQ

**Qual a diferença entre `spec`, `contract` e `issue`?**

- `specs/<fase>.md` = a spec **da fase** (Camada 2). Diz O QUÊ a fase entrega.
- `behaviors/<dominio>/<behavior>/contract.md` = contrato detalhado do **módulo de código** (escrito uma vez, evolui pouco). Diz como o módulo se comporta para quem o consome.
- `behaviors/<dominio>/<behavior>/issues/NN-*.md` = **tarefas executáveis** geradas pelo `/break`. Cada uma vira 1 commit.

**Por que `/spec` é por fase e não por behavior?**
Para evitar inflação de specs. Uma fase = um marco entregável. Os behaviors são **a arquitetura de código** que entrega aquela fase. O contrato de cada behavior fica em `contract.md` (escrito sob demanda quando o behavior é não-trivial).

**Posso adicionar novos domínios além dos 6?**  
Sim, mas justifique no commit. Domínios extras significam novos agentes ou novas regras.

**O que faço se um behavior depende de outro que ainda não existe?**  
`/break` deve sequenciar: dependência primeiro. Issue do dependente vem antes no número.

**Posso ter behavior só backend (sem UI)?**  
Sim. `monitoring/auto-rewrite`, por exemplo, é puro backend. O `/break` pula passos de UI.

**Quem cria o número da issue (01, 02, ...)?**  
O agente do `/break`. Sequencial por ordem de execução, com `depends_on` explícito.

**Posso pular `/plan` para mudanças triviais?**  
Não. Mesmo trivial precisa de lista de arquivos. Plan trivial é trivial de escrever.

**E se um behavior fica enorme (50 issues)?**  
Sinal de que é múltiplos behaviors disfarçados. Quebrar em sub-behaviors.

**Quando escrevo o `contract.md` de um behavior?**
Quando o behavior é não-trivial e múltiplas issues vão consumi-lo (ex: `data-model` vira input de tudo). Para behaviors triviais, pode pular: a issue + plan já bastam.

**Já temos vários `spec.md` em `behaviors/research/*/`. O que faço com eles?**
Esses arquivos foram escritos antes da decisão de "1 spec por fase". Eles são de fato **contratos detalhados**, não specs. Plano: renomear `spec.md` → `contract.md` e criar `specs/fase-0-research-pipeline.md` resumindo a fase.