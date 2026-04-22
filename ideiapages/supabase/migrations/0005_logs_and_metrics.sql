-- =============================================================================
-- Migration: 0005_logs_and_metrics
-- Issue:     research/data-model/04-logs-and-metrics
-- Fase:      fase-0-research-pipeline
-- Intencao:  Auditoria de chamadas LLM e execucoes de collectors (research + futuro).
-- =============================================================================

create table if not exists public.llm_calls_log (
  id                      uuid primary key default gen_random_uuid(),
  behavior                text not null,
  purpose                 text not null,
  model                   text not null,
  prompt_version          integer,
  tokens_input            integer,
  tokens_output           integer,
  custo_brl               numeric(10, 4),
  latencia_ms             integer,
  termo_id                uuid references public.termos (id) on delete set null,
  payload_resumido_jsonb  jsonb,
  criado_em               timestamptz not null default now()
);

create index if not exists llm_calls_log_behavior_idx
  on public.llm_calls_log (behavior);
create index if not exists llm_calls_log_criado_em_idx
  on public.llm_calls_log (criado_em desc);
create index if not exists llm_calls_log_termo_id_idx
  on public.llm_calls_log (termo_id);

comment on table public.llm_calls_log is
  'Auditoria de chamadas LLM (sem prompt completo; apenas resumo em payload_resumido_jsonb).';

alter table public.llm_calls_log enable row level security;

drop policy if exists "llm_calls_log_service_role_all" on public.llm_calls_log;

create policy "llm_calls_log_service_role_all"
  on public.llm_calls_log
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- -----------------------------------------------------------------------------

create table if not exists public.metricas_coleta (
  id                  uuid primary key default gen_random_uuid(),
  behavior            text not null,
  comecou_em          timestamptz not null,
  terminou_em         timestamptz,
  items_processados   integer not null default 0,
  items_sucesso       integer not null default 0,
  items_falha         integer not null default 0,
  custo_brl           numeric(10, 4),
  log_jsonb           jsonb
);

create index if not exists metricas_coleta_behavior_idx
  on public.metricas_coleta (behavior);
create index if not exists metricas_coleta_comecou_em_idx
  on public.metricas_coleta (comecou_em desc);

comment on table public.metricas_coleta is
  'Metricas por execucao de collector (items, custo, log).';

alter table public.metricas_coleta enable row level security;

drop policy if exists "metricas_coleta_service_role_all" on public.metricas_coleta;

create policy "metricas_coleta_service_role_all"
  on public.metricas_coleta
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
