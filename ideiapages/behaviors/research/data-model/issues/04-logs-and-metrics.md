---
issue: 04-logs-and-metrics
behavior: research/data-model
fase: fase-0-research-pipeline
status: done
depends_on: [research/data-model/03-briefings]
---

# Issue 04 — Criar tabelas `llm_calls_log` e `metricas_coleta`

## Objetivo
Criar duas tabelas auxiliares de auditoria: chamadas LLM (custo + uso) e métricas de execução de collectors.

## Critérios de aceitação
- [x] Migration `supabase/migrations/0005_logs_and_metrics.sql` criada
- [x] `llm_calls_log`: id, behavior (text), purpose (text), model (text), prompt_version (int), tokens_input (int), tokens_output (int), custo_brl (numeric(10,4)), latencia_ms (int), termo_id (FK nullable ON DELETE SET NULL), payload_resumido_jsonb (jsonb), criado_em
- [x] `metricas_coleta`: id, behavior (text), comecou_em, terminou_em, items_processados (int), items_sucesso (int), items_falha (int), custo_brl (numeric(10,4)), log_jsonb (jsonb)
- [x] Índices em `behavior`, `criado_em`, `comecou_em`
- [x] RLS ativada; service_role-only
- [x] Migration aplicada (MCP `logs_and_metrics`)
- [x] Smoke test: insert em ambas + update termo (dispara trigger da issue 05) — `smoke_ok_logs_metrics_trigger`

## Notas para o agente
- `llm_calls_log.behavior` é texto livre (ex: `"research/classify-terms"`, `"research/analyze-gaps"`)
- `payload_resumido_jsonb` guarda resumo do input/output (NÃO o prompt completo — protege privacidade e tamanho)
- Tabelas genéricas: serão usadas por behaviors futuros (Fase 2 generation, Fase 4 monitoring)

## Não fazer aqui
- Trigger de updated_at compartilhado — issue 05
- Lógica de cálculo de custo (preço por modelo) — vira código Python no behavior
