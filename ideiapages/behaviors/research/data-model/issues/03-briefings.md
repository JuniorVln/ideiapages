---
issue: 03-briefings
behavior: research/data-model
fase: fase-0-research-pipeline
status: done
depends_on: [research/data-model/02-snapshots-and-content]
---

# Issue 03 — Criar tabela `briefings_seo`

## Objetivo
Criar tabela que armazena os briefings SEO gerados pelo behavior `analyze-gaps`.

## Critérios de aceitação
- [x] Migration `supabase/migrations/0004_briefings_seo.sql` criada
- [x] Colunas: id, termo_id (FK ON DELETE CASCADE), prompt_version (int), model (text), briefing_jsonb (jsonb NOT NULL), custo_brl (numeric(10,4)), criado_em (timestamptz)
- [x] Constraint: `briefing_jsonb ? 'version'` (garante schema interno versionado)
- [x] Índice em `termo_id` e `criado_em`
- [x] RLS ativada; service_role-only
- [x] Migration aplicada (MCP `briefings_seo`)
- [x] Smoke test: insert briefing + cascade delete via termo — `smoke_ok_briefings`

## Notas para o agente
- `briefing_jsonb` deve sempre ter `{ "version": 1, ... }` na raiz para evolução de schema futura
- Permitir múltiplos briefings para o mesmo `termo_id` (histórico) — NÃO unique
- Coluna `model` aceita texto livre ("claude-sonnet-4-5-20250929", etc.)

## Não fazer aqui
- Schema interno do briefing_jsonb — fica para o behavior `analyze-gaps` definir
- Validação de conteúdo do briefing — vira responsabilidade do quality-reviewer
