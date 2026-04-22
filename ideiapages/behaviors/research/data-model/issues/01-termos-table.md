---
issue: 01-termos-table
behavior: research/data-model
fase: fase-0-research-pipeline
status: done
depends_on: []
---

# Issue 01 — Criar tabela `termos`

## Objetivo
Criar a tabela canônica de termos coletados (raiz de todo o pipeline de research) com RLS, índices e enums-via-check.

## Critérios de aceitação
- [x] Migration `supabase/migrations/0001_termos.sql` criada com header documentando intenção e issue
- [x] Tabela `termos` com colunas conforme `references/data_model.md`: id (uuid), keyword (text unique), fonte, intencao, score_conversao (1-10 check), tipo_pagina_recomendado, cluster, status, justificativa, tendencia_pytrends (jsonb), metadata (jsonb), created_at, updated_at
- [x] RLS ativada; policy `service_role` com USING/WITH CHECK true; nenhuma policy para `anon`
- [x] Índices em `keyword` (unique case-insensitive via `lower(keyword)`), `status`, `cluster`, `fonte`, `score_conversao`, `created_at desc`
- [x] CHECKs: `score_conversao between 1 and 10`, `dificuldade between 1 and 100`, `status in (...)`, `intencao in (...)`, `fonte in (...)`, `tipo_pagina_recomendado in (...)`, `keyword = lower(keyword)`, `char_length(keyword) between 2 and 200`
- [x] Migration aplicada no Supabase com sucesso (MCP `apply_migration`, versão `20260420152813`, nome `termos`)
- [x] Smoke test: insert + update + delete via `execute_sql` (role com privilégios de projeto) OK; RLS ativa na tabela

## Notas de execução

- Coluna `volume_estimado` e `dificuldade` adicionadas conforme `references/data_model.md` (não estavam no critério original mas estão no esquema canônico)
- Status enum estendido para cobrir transições do pipeline: `coletado → analisado → priorizado → snapshot_serp_ok → scraped → briefing_pronto` (decisão tomada vendo as outras issues que precisam mover o termo entre estados)
- Trigger de `updated_at` deliberadamente NÃO aqui — fica para issue 05 (compartilhado)
- Para aplicar manualmente: copiar conteúdo de `supabase/migrations/0001_termos.sql` no SQL Editor do Supabase Studio

## Notas para o agente
- Usar `text + check` para enums (não `create type ... as enum`) — facilita evolução
- Slug case-insensitive: usar `lower(keyword)` no constraint unique
- Coluna `keyword` deve aceitar até 200 chars (usar `varchar(200)` ou `text` + check de length)
- Não criar trigger de updated_at aqui — fica para issue 05 (compartilhado)

## Não fazer aqui
- Outras tabelas (snapshots, conteúdo, briefings) — issues 02-04
- Trigger de updated_at compartilhado — issue 05
- Regenerar tipos TS — issue 05
