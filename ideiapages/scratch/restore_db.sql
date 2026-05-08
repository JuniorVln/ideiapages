-- =============================================================================
-- Restore Missing Tables in Production
-- Tables: llm_calls_log, metricas_coleta, admin_google_oauth, generative_visibility_checks
-- Columns: paginas.imagens_contexto_jsonb
-- =============================================================================

-- 0005: Logs and Metrics
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

create index if not exists llm_calls_log_behavior_idx on public.llm_calls_log (behavior);
create index if not exists llm_calls_log_criado_em_idx on public.llm_calls_log (criado_em desc);
create index if not exists llm_calls_log_termo_id_idx on public.llm_calls_log (termo_id);

alter table public.llm_calls_log enable row level security;
drop policy if exists "llm_calls_log_service_role_all" on public.llm_calls_log;
create policy "llm_calls_log_service_role_all" on public.llm_calls_log as permissive for all to service_role using (true) with check (true);

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

create index if not exists metricas_coleta_behavior_idx on public.metricas_coleta (behavior);
create index if not exists metricas_coleta_comecou_em_idx on public.metricas_coleta (comecou_em desc);

alter table public.metricas_coleta enable row level security;
drop policy if exists "metricas_coleta_service_role_all" on public.metricas_coleta;
create policy "metricas_coleta_service_role_all" on public.metricas_coleta as permissive for all to service_role using (true) with check (true);

-- 0013: Admin Google OAuth
create table if not exists public.admin_google_oauth (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  criado_em     timestamptz not null default now(),
  actualizado_em timestamptz not null default now()
);

create index if not exists admin_google_oauth_actualizado_em_idx on public.admin_google_oauth (actualizado_em desc);

alter table public.admin_google_oauth enable row level security;
drop policy if exists "admin_google_oauth_service_role_all" on public.admin_google_oauth;
create policy "admin_google_oauth_service_role_all" on public.admin_google_oauth as permissive for all to service_role using (true) with check (true);

-- 0014: Paginas Imagens Contexto
alter table public.paginas add column if not exists imagens_contexto_jsonb jsonb null;

-- 0015: Generative Visibility Checks
create table if not exists public.generative_visibility_checks (
  id            uuid primary key default gen_random_uuid(),
  pagina_id     uuid not null references public.paginas (id) on delete cascade,
  termo_id      uuid references public.termos (id) on delete set null,
  engine        text not null,
  checked_at    timestamptz not null default now(),
  mentioned     boolean not null,
  detail_jsonb  jsonb,
  criado_em     timestamptz not null default now(),
  constraint generative_visibility_checks_engine_len_chk check (char_length(trim(engine)) > 0)
);

create index if not exists generative_visibility_checks_pagina_id_idx on public.generative_visibility_checks (pagina_id);
create index if not exists generative_visibility_checks_checked_at_idx on public.generative_visibility_checks (checked_at desc);
create index if not exists generative_visibility_checks_termo_id_idx on public.generative_visibility_checks (termo_id) where termo_id is not null;

alter table public.generative_visibility_checks enable row level security;
drop policy if exists "generative_visibility_checks_service_role_all" on public.generative_visibility_checks;
create policy "generative_visibility_checks_service_role_all" on public.generative_visibility_checks as permissive for all to service_role using (true) with check (true);
