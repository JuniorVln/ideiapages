-- =============================================================================
-- Migration: 0004_briefings_seo
-- Issue:     research/data-model/03-briefings
-- Fase:      fase-0-research-pipeline
-- Intencao:  Armazenar briefings SEO gerados pelo behavior analyze-gaps (historico por termo).
-- =============================================================================

create table if not exists public.briefings_seo (
  id              uuid primary key default gen_random_uuid(),
  termo_id        uuid not null references public.termos (id) on delete cascade,
  prompt_version  integer not null default 1,
  model           text not null,
  briefing_jsonb  jsonb not null,
  custo_brl       numeric(10, 4),
  criado_em       timestamptz not null default now(),

  constraint briefings_seo_briefing_has_version_key_chk
    check (briefing_jsonb ? 'version')
);

create index if not exists briefings_seo_termo_id_idx
  on public.briefings_seo (termo_id);
create index if not exists briefings_seo_criado_em_idx
  on public.briefings_seo (criado_em desc);

comment on table public.briefings_seo is
  'Briefing SEO (JSONB versionado na raiz) gerado por analyze-gaps; multiplos por termo para historico.';

alter table public.briefings_seo enable row level security;

drop policy if exists "briefings_seo_service_role_all" on public.briefings_seo;

create policy "briefings_seo_service_role_all"
  on public.briefings_seo
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
