# Spec-Driven Development — Como Trabalhar no IDeiaPages

> Manual prático do workflow SDD adaptado para este projeto.

---

## TL;DR

Para qualquer feature, bug ou ajuste:

```
/spec <dominio>/<behavior>     →  define O QUÊ
/break <dominio>/<behavior>    →  fatia em issues
/plan <dominio>/<behavior>/<issue>   →  define ONDE e COMO
/execute <dominio>/<behavior>/<issue>  →  agente faz
```

E **sempre** com `references/` lida pelo agente antes.

---

## Por que SDD aqui

IDeiaPages tem dezenas de comportamentos diferentes (research, generation, conversion, A/B, autocura). Sem isolamento:

- Mudar geração quebra captura de leads
- Mudar form quebra A/B
- Cada feature nova exige reler todo o codebase

Com behavior-oriented isolation:

- Cada behavior tem sua pasta, sua spec, suas issues, seu código
- LLM recebe escopo curto → mais qualidade, menos retrabalho
- Refactor de uma feature não afeta outras

---

## Domínios

| Domínio | O que mora aqui | Exemplos de behaviors |
|---------|-----------------|------------------------|
| `research` | Coleta e análise de termos | `collect-autocomplete`, `scrape-competitors`, `classify-terms` |
| `generation` | Geração de conteúdo com LLMs | `claude-generator`, `quality-gate` |
| `rendering` | Renderização de páginas públicas | `render-blog-post`, `render-landing-page` |
| `conversion` | Captura de leads | `lead-form-submit`, `whatsapp-modal`, `utm-tracking` |
| `experiments` | Teste A/B | `assign-variation`, `track-metrics`, `declare-winner` |
| `monitoring` | Autocura e escala | `detect-ranking-drop`, `auto-rewrite` |

---

## Pipeline detalhado

### 1. `/spec <dominio>/<behavior>`

Cria `behaviors/<dominio>/<behavior>/spec.md`.

A spec descreve:
- Objetivo e contexto
- Triggers (gatilhos do usuário/sistema)
- Comportamentos esperados por trigger (passo a passo)
- Estados, entradas/saídas
- Dependências (sem importar código de outro behavior)
- Critérios de aceitação testáveis
- Não-objetivos (out of scope)

**Exemplo**: `behaviors/conversion/lead-form-submit/spec.md`

A spec **não menciona arquivos, paths ou tecnologia específica**. É comportamento puro.

### 2. `/break <dominio>/<behavior>`

Decompõe a spec em issues sequenciais em `behaviors/<dominio>/<behavior>/issues/`.

**Regra de ouro**: frontend stub primeiro, lógica e DB depois.

Ordem típica:
1. `01-stub-ui.md` — componente sem lógica
2. `02-types-contracts.md` — schemas zod, tipos TS
3. `03-migration.md` — schema Supabase
4. `04-server-logic.md` — route handler / Python
5. `05-wire-up.md` — UI fala com server
6. `06-validation.md` — testar caminho feliz E2E
7. `07-edge-cases.md` — erros, validação, race conditions
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

## Agentes especialistas

Cada um é um expert numa camada. Veja `.cursor/agents/`:

| Agente | Camada |
|--------|--------|
| `model-writer` | SQL Supabase + RLS |
| `python-collector-writer` | Coleta Python (Apify/Firecrawl/pytrends) |
| `python-analyzer-writer` | Análise Python (LLM) |
| `component-writer` | Componentes React isolados |
| `seo-page-writer` | Páginas Next.js com SEO completo |
| `prompt-engineer` | Templates de prompt versionados |
| `quality-reviewer` | Auditoria read-only |

Cada agente tem `allowed_paths` explícitos. Não escapa do seu domínio.

---

## Knowledge base (`references/`)

São 8 arquivos lidos por TODO agente antes de gerar código:

| Arquivo | Quando ler |
|---------|------------|
| `architecture.md` | sempre |
| `security_rules.md` | sempre |
| `design_system.md` | UI / componentes |
| `seo_rules.md` | páginas Next.js públicas |
| `data_model.md` | banco / migrations |
| `conversion_principles.md` | forms / CTAs / leads |
| `prompts_engineering.md` | LLMs |
| `product_facts.md` | conteúdo sobre Ideia Chat |

Quando algo na knowledge base muda, comunicar via commit (`docs:`) e revisar behaviors afetados.

---

## Estrutura de pastas

```
ideiapages/
├── .cursor/
│   ├── commands/    spec, break, plan, execute (slash commands)
│   ├── agents/      7 agentes
│   └── rules/       always-read-references
├── references/      knowledge base
├── behaviors/       specs e issues por comportamento
│   ├── research/
│   │   └── collect-autocomplete/
│   │       ├── spec.md
│   │       └── issues/
│   │           ├── 01-types.md
│   │           ├── 01-types-plan.md
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

**Posso adicionar novos domínios além dos 6?**  
Sim, mas justifique no PR. Domínios extras significam novos agentes ou novas regras.

**O que faço se um behavior depende de outro que ainda não existe?**  
`/spec` o dependente primeiro. Documentar no `spec.md` do behavior original.

**Posso ter behavior só backend (sem UI)?**  
Sim. `monitoring/auto-rewrite`, por exemplo, é puro backend. O `/break` pula passos de UI.

**Quem cria o número da issue (01, 02, ...)?**  
O agente do `/break`. Sequencial por ordem de execução, com `depends_on` explícito.

**Posso pular `/plan` para mudanças triviais?**  
Não. Mesmo trivial precisa de lista de arquivos. Plan trivial é trivial de escrever.

**E se um behavior fica enorme (50 issues)?**  
Sinal de que é múltiplos behaviors disfarçados. Quebrar em sub-behaviors.
