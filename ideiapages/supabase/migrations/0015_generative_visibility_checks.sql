-- =============================================================================
-- Migration: 0015_generative_visibility_checks
-- Intenção:  Registos de visibilidade em motores generativos (GEO) por página.
-- =============================================================================

create table if not exists public.generative_visibility_checks (
  id            uuid primary key default gen_random_uuid(),
  pagina_id     uuid not null references public.paginas (id) on delete cascade,
  termo_id      uuid references public.termos (id) on delete set null,
  engine        text not null,
  checked_at    timestamptz not null default now(),
  mentioned     boolean not null,
  detail_jsonb  jsonb,
  criado_em     timestamptz not null default now(),

  constraint generative_visibility_checks_engine_len_chk
    check (char_length(trim(engine)) > 0)
);

create index if not exists generative_visibility_checks_pagina_id_idx
  on public.generative_visibility_checks (pagina_id);

create index if not exists generative_visibility_checks_checked_at_idx
  on public.generative_visibility_checks (checked_at desc);

create index if not exists generative_visibility_checks_termo_id_idx
  on public.generative_visibility_checks (termo_id)
  where termo_id is not null;

comment on table public.generative_visibility_checks is
  'Checks de visibilidade GEO (IA): menção da marca/página em motores generativos; alimentado por API admin ou import.';

alter table public.generative_visibility_checks enable row level security;

drop policy if exists "generative_visibility_checks_service_role_all"
  on public.generative_visibility_checks;

create policy "generative_visibility_checks_service_role_all"
  on public.generative_visibility_checks
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
