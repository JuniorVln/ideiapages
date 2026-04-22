-- =============================================================================
-- Migration: 0002_serp_snapshots
-- Issue:     research/data-model/02-snapshots-and-content
-- Fase:      fase-0-research-pipeline
-- Intencao:  Snapshot imutavel do SERP (uma linha por posicao organica).
-- =============================================================================

create table if not exists public.serp_snapshots (
  id                uuid primary key default gen_random_uuid(),
  termo_id          uuid not null references public.termos (id) on delete cascade,
  posicao           integer not null,
  url               text not null,
  titulo            text,
  meta_description  text,
  capturado_em      timestamptz not null default now(),
  raw_jsonb         jsonb,

  constraint serp_snapshots_posicao_chk
    check (posicao between 1 and 50),

  constraint serp_snapshots_termo_posicao_data_uniq
    unique (termo_id, posicao, capturado_em)
);

create index if not exists serp_snapshots_termo_id_idx
  on public.serp_snapshots (termo_id);
create index if not exists serp_snapshots_capturado_em_idx
  on public.serp_snapshots (capturado_em desc);
create index if not exists serp_snapshots_termo_capturado_idx
  on public.serp_snapshots (termo_id, capturado_em desc);

comment on table public.serp_snapshots is
  'Resultados organicos do Google por termo e instante de coleta (imutavel).';

alter table public.serp_snapshots enable row level security;

drop policy if exists "serp_snapshots_service_role_all" on public.serp_snapshots;

create policy "serp_snapshots_service_role_all"
  on public.serp_snapshots
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
