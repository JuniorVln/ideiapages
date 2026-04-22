---
issue: 05-shared-triggers-rls-types
behavior: research/data-model
fase: fase-0-research-pipeline
status: done
depends_on: [research/data-model/04-logs-and-metrics]
---

# Issue 05 — Trigger compartilhado de `updated_at` + auditoria de RLS + regeneração de tipos TS

## Objetivo
Fechar a entrega de schema com: (a) trigger `updated_at` compartilhado aplicado em tabelas que têm essa coluna, (b) auditoria final de RLS confirmando que `anon` não lê nenhuma das tabelas, (c) tipos TypeScript regenerados em `web/src/lib/database.types.ts`.

## Critérios de aceitação
- [x] Migration `supabase/migrations/0006_shared_triggers.sql` criada
- [x] Função `set_updated_at()` criada uma vez no schema `public`
- [x] Trigger `BEFORE UPDATE` aplicado em `public.termos` (`termos_set_updated_at`)
- [x] Auditoria via SQL: `pg_tables` em `public` sem RLS — resultado vazio (todas com RLS)
- [ ] Auditoria via teste manual com cliente **anon** (recomendado: app com `NEXT_PUBLIC_SUPABASE_ANON_KEY` sem policy em `termos` → 0 linhas)
- [x] Tipos TS regenerados via Supabase MCP em `web/src/lib/database.types.ts` (equivalente a `pnpm db:types` quando CLI não está linkado)
- [x] Tipos TS: `Database['public']['Tables']['termos']` e demais tabelas research presentes

## Notas para o agente
- Função `set_updated_at` é padrão Supabase: `NEW.updated_at = NOW(); RETURN NEW;`
- Aplicar trigger só onde `updated_at` existe (não em snapshots, conteúdo, briefings — todos imutáveis ou append-only)
- O comando `pnpm db:types` está no `package.json` do `web/`. Se falhar, verificar `SUPABASE_PROJECT_ID` no env
- Documentar no commit: lista de migrations aplicadas e link para o snapshot do schema no Supabase Studio

## Não fazer aqui
- Mudanças em outras tabelas — issues anteriores cobrem
- Implementação de qualquer collector — fica para os outros behaviors
