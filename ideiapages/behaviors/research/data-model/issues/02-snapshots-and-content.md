---
issue: 02-snapshots-and-content
behavior: research/data-model
fase: fase-0-research-pipeline
status: done
depends_on: [research/data-model/01-termos-table]
---

# Issue 02 — Criar tabelas `serp_snapshots` e `conteudo_concorrente`

## Objetivo
Criar as duas tabelas que armazenam snapshots SERP e o markdown raspado dos concorrentes.

## Critérios de aceitação
- [x] Migration `supabase/migrations/0002_serp_snapshots.sql` criada
- [x] Migration `supabase/migrations/0003_conteudo_concorrente.sql` criada
- [x] `serp_snapshots`: id, termo_id (FK ON DELETE CASCADE), posicao (1-50 check), url, titulo, meta_description, capturado_em, raw_jsonb (jsonb), unique(termo_id, posicao, capturado_em)
- [x] `conteudo_concorrente`: id, snapshot_id (FK ON DELETE CASCADE), url, markdown (text), word_count (int), headings_h2 (text[]), headings_h3 (text[]), tem_faq (bool), tem_tabela (bool), tem_imagem (bool), idioma_detectado (text), thin (bool default false), truncated (bool default false), paywalled (bool default false), raspado_em, unique(snapshot_id, url)
- [x] RLS ativada em ambas; policies só para `service_role`
- [x] Índices em FKs e `capturado_em`/`raspado_em`
- [x] Migrations aplicadas no remoto via MCP (`serp_snapshots`, `conteudo_concorrente`)
- [x] Smoke test: transação insert termo → serp → conteúdo → delete termo (cascade) — `smoke_ok_issue_02`

## Notas para o agente
- `serp_snapshots` é imutável: NÃO criar coluna `updated_at` nem trigger
- `conteudo_concorrente.markdown` pode ser longo — usar `text` (sem limit)
- `headings_h2` e `headings_h3` como `text[]` (array Postgres nativo)
- `idioma_detectado`: 2-5 chars (`pt-BR`, `pt`, `en`, `es`, `unknown`)

## Não fazer aqui
- Tabela `briefings_seo` — issue 03
- Tabela `metricas_coleta` ou `llm_calls_log` — issue 04
