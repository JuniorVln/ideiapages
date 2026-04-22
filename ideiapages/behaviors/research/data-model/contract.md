---
behavior: research/data-model
status: draft
created: 2026-04-16
owner: junior
---

# Spec — Research Data Model

## Objetivo

Definir e materializar no Supabase as **tabelas, colunas, índices, RLS policies e triggers** que dão suporte a todos os behaviors do domínio `research`. Esta é uma **dependência transversal** das demais specs do domínio: nada coleta, classifica ou analisa sem o esquema persistido.

## Contexto

Os behaviors `collect-autocomplete`, `collect-serp`, `scrape-competitors`, `collect-trends`, `classify-terms` e `analyze-gaps` precisam ler/escrever em tabelas comuns. Sem o esquema pronto, qualquer um deles é só código que não persiste. Por isso `data-model` é a **primeira issue do domínio research a ser executada** após este pipeline de specs.

## Triggers

1. **Operador roda** o `model-writer` para criar/atualizar as migrations
2. **Sistema executa** as migrations no Supabase via Supabase CLI (`supabase db push`) ou manual no SQL Editor
3. **Operador regenera** os tipos TypeScript após qualquer migration nova (`pnpm db:types`)

## Comportamentos esperados

### Trigger 1: Criação inicial (Issue 0001)

1. `model-writer` cria migrations sequenciais que materializam todas as tabelas necessárias para o domínio `research`
2. Cada tabela recebe RLS ativada e policies explícitas
3. Triggers de `updated_at` aplicados onde fizer sentido
4. Índices criados em colunas de busca frequente
5. Migration aplicada ao Supabase
6. Tipos TypeScript regenerados em `web/src/lib/database.types.ts`

### Trigger 2: Evolução do schema

Quando algum behavior precisa de coluna nova ou tabela nova:
1. Nova migration `NNNN_<descricao>.sql` é criada (forward-only)
2. Aplicada ao Supabase
3. Tipos TS regenerados
4. Specs dos behaviors afetados atualizadas se houver mudança contratual

## Estados

- **Esquema vazio** — antes da primeira migration
- **Esquema base aplicado** — migrations 0001-0005 rodadas
- **Esquema evoluído** — migrations adicionais conforme outros behaviors evoluem

## Entradas / Saídas

**Entradas**:
- Specs dos demais behaviors do domínio (que descrevem o que precisam persistir)
- `references/data_model.md` (esquema canônico documentado)
- Acesso ao Supabase (service_role)

**Saídas**:
- Arquivos SQL em `supabase/migrations/NNNN_*.sql`
- Tabelas criadas no Supabase com RLS policies
- Tipos TypeScript atualizados em `web/src/lib/database.types.ts`

## Tabelas alvo (mínimo viável para domínio research)

A lista canônica está em `references/data_model.md`. Para o domínio research no MVP:

| Tabela | Propósito | Behavior consumidor principal |
|--------|-----------|--------------------------------|
| `termos` | Termos coletados + classificação | todos |
| `serp_snapshots` | Snapshots SERP por termo + data | `collect-serp`, `scrape-competitors`, `monitoring/*` (futuro) |
| `conteudo_concorrente` | Markdown raspado por URL | `scrape-competitors`, `analyze-gaps` |
| `briefings_seo` | Output do `analyze-gaps` | `analyze-gaps`, `generation/*` (futuro) |
| `classificacoes_log` | Auditoria de classificações LLM | `classify-terms` |
| `metricas_coleta` | Auditoria de execuções de collectors | todos os collectors |

Tabelas de **outros domínios** (`paginas`, `variacoes`, `leads`, `metricas_diarias`) ficam para issues posteriores (Fase 1+).

## Regras de negócio

1. **RLS sempre ativa** em toda tabela criada
2. **Policies mínimas**: `service_role` faz tudo; `anon` só lê o estritamente público (no domínio research, **nada é público**)
3. **Naming consistente** com `references/data_model.md` (snake_case, plural, FKs `<tabela>_id`)
4. **Migrations forward-only** — sem rollback. Para reverter, criar nova migration
5. **Numeração sequencial** zero-padded (`0001_`, `0002_`...)
6. **`updated_at` automático** via trigger compartilhado em `0005_triggers.sql`
7. **Constraints e CHECKs** para invariantes (ex: `score_conversao` entre 1 e 10)
8. **Soft delete** apenas onde fizer sentido (não para snapshots, que são imutáveis e auditáveis)
9. **JSONB para dados realmente variáveis** — `tendencia_pytrends`, `briefing_jsonb`. Não para dados que poderiam ser colunas
10. **Índices em FKs e colunas de filtro frequente** (`status`, `slug`, `keyword`)

## Critérios de aceitação

- [ ] Migrations 0001 a 0005 criadas em `supabase/migrations/` com nomes descritivos
- [ ] Cada migration roda limpa (idempotente com `if not exists`)
- [ ] Todas as tabelas têm RLS ativada e ao menos uma policy explícita
- [ ] Triggers `updated_at` funcionando em todas as tabelas com essa coluna
- [ ] Índices criados em FKs e colunas de filtro
- [ ] `web/src/lib/database.types.ts` regenerado e contém todos os tipos
- [ ] Smoke test: insert + select + update via service_role funciona em cada tabela
- [ ] Smoke test: leitura via anon NÃO retorna dados de `termos`, `serp_snapshots`, `conteudo_concorrente`, `briefings_seo`, `leads` (RLS bloqueia)
- [ ] Naming bate com `references/data_model.md`
- [ ] Comentário SQL no header de cada migration documenta intenção e issue

## Não-objetivos (out of scope)

- Tabelas dos domínios `rendering`, `conversion`, `experiments`, `monitoring` (cada domínio terá sua própria spec de data-model)
- Esquema de auth (Supabase Auth fora do escopo do domínio research)
- Funções RPC complexas (caso surjam, viram migrations à parte com sua própria issue)
- pgvector / embeddings (anotado para iteração futura quando entrar busca semântica nos termos)
- Particionamento de tabelas (`serp_snapshots` pode crescer, mas no MVP não chega a precisar)

## Métricas de sucesso

| Métrica | Alvo |
|---------|------|
| Migrations aplicadas com sucesso na primeira tentativa | 100% |
| Tempo total para subir o esquema base | ≤ 2 min |
| Falhas por RLS faltando após auditoria | 0 |
| Tipos TS gerados sem `any` indesejado | sim |

## Riscos / decisões em aberto

1. **Supabase CLI vs SQL Editor manual**: CLI é mais profissional (versionamento, rollback de tentativas), mas exige `supabase login` e `link`. Manual via dashboard é fallback. **Decisão recomendada**: usar CLI sempre que possível, manual como fallback documentado.

2. **Schema `public` ou schema próprio (`research`)?** Postgres permite organizar por schemas. Inicialmente tudo em `public` por simplicidade do Supabase Studio. Anotado para refator futuro se ficar muito populado.

3. **`tendencia_pytrends` como JSONB completo ou tabela separada de série temporal?** Para MVP, JSONB cabe (~50 pontos × ~30 termos ativos = nada). Se futuramente passar de 1k termos com séries históricas, virar tabela. Anotado.

4. **`briefings_seo.briefing_jsonb`**: schema interno do JSONB precisa ser estável para o `generation/*` consumir. Versionar via campo `version: int` dentro do jsonb. Decidir formato detalhado no `/plan` desta spec.

5. **Auditoria de custos LLM**: tabela `classificacoes_log` cobre `classify-terms`. Vale tabela genérica `llm_calls_log` que serve a `analyze-gaps` e a `generation/*` futuros? **Decisão recomendada**: sim, criar `llm_calls_log` genérica (com campo `behavior` e `purpose`) em vez de uma tabela por behavior. Reduz duplicação.

6. **Constraints de enum**: usar `text + check (valor in ('a','b','c'))` ou `create type ... as enum`?
   - `enum nativo`: mais limpo, mas alterar enum exige migration cuidadosa
   - `text + check`: mais flexível
   
   **Decisão recomendada**: `text + check` (Supabase + tooling lidam melhor, e evolução é mais barata).

7. **Tabela `metricas_coleta`**: schema preliminar — `id, behavior, started_at, ended_at, items_processed, items_succeeded, items_failed, custo_brl, log_jsonb`. Validar com `model-writer` no `/plan`.
