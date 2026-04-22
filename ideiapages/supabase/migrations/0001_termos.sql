-- =============================================================================
-- Migration: 0001_termos
-- Issue:     research/data-model/01-termos-table
-- Fase:      fase-0-research-pipeline
-- Author:    model-writer (orquestrado por /execute)
-- Intencao:  Criar a tabela canonica `termos` que e raiz do pipeline de research.
--            Todo termo coletado (autocomplete/PAA/seed/related/manual_trends),
--            classificado pelo classify-terms e priorizado para os passos seguintes
--            do pipeline e persistido aqui.
--
-- Comportamento:
--   - RLS ativada; nenhuma policy para anon (dominio research nao e publico).
--   - Service_role faz tudo (collectors Python e route handlers usam service_role).
--   - Enums via CHECK em coluna text (decisao em references/data_model.md e na spec).
--   - keyword unica case-insensitive (lower(keyword)).
--   - Trigger de updated_at vira em 0006 (compartilhado).
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.termos (
  id                          uuid primary key default gen_random_uuid(),
  keyword                     text not null,
  fonte                       text not null,
  volume_estimado             integer,
  tendencia_pytrends          jsonb,
  dificuldade                 integer,
  intencao                    text,
  score_conversao             integer,
  cluster                     text,
  tipo_pagina_recomendado     text,
  status                      text not null default 'coletado',
  justificativa               text,
  metadata                    jsonb not null default '{}'::jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint termos_keyword_length_chk
    check (char_length(keyword) between 2 and 200),

  constraint termos_keyword_lowercase_chk
    check (keyword = lower(keyword)),

  constraint termos_fonte_chk
    check (fonte in ('autocomplete', 'paa', 'seed', 'related', 'manual_trends')),

  constraint termos_intencao_chk
    check (
      intencao is null
      or intencao in ('informacional', 'transacional', 'comparativa', 'navegacional')
    ),

  constraint termos_score_conversao_chk
    check (
      score_conversao is null
      or (score_conversao between 1 and 10)
    ),

  constraint termos_dificuldade_chk
    check (
      dificuldade is null
      or (dificuldade between 1 and 100)
    ),

  constraint termos_tipo_pagina_chk
    check (
      tipo_pagina_recomendado is null
      or tipo_pagina_recomendado in ('landing', 'blog', 'comparison', 'faq', 'guide')
    ),

  constraint termos_status_chk
    check (status in (
      'coletado',
      'analisado',
      'priorizado',
      'snapshot_serp_ok',
      'scraped',
      'briefing_pronto',
      'descartado'
    ))
);

-- Unicidade case-insensitive da keyword.
create unique index if not exists termos_keyword_unique_idx
  on public.termos (lower(keyword));

-- Indices de filtragem frequente.
create index if not exists termos_status_idx        on public.termos (status);
create index if not exists termos_cluster_idx       on public.termos (cluster);
create index if not exists termos_fonte_idx         on public.termos (fonte);
create index if not exists termos_score_conv_idx    on public.termos (score_conversao);
create index if not exists termos_created_at_idx    on public.termos (created_at desc);

comment on table public.termos is
  'Termos de pesquisa coletados, classificados e priorizados (research domain).';
comment on column public.termos.status is
  'Estado no pipeline: coletado -> analisado -> priorizado -> snapshot_serp_ok -> scraped -> briefing_pronto (ou descartado).';
comment on column public.termos.tendencia_pytrends is
  'JSONB v1 com serie temporal, tendencia (crescente/estavel/decrescente), pico_mes, queries relacionadas. Preenchido pelo behavior collect-trends.';
comment on column public.termos.metadata is
  'Bag livre para flags como falha_classificacao=true, observacoes, etc. Nunca usar para campos com semantica fixa.';

-- =============================================================================
-- RLS — service_role faz tudo; anon nao acessa nada.
-- =============================================================================

alter table public.termos enable row level security;

-- Limpar policies antigas (idempotente em re-run manual).
drop policy if exists "termos_service_role_all"  on public.termos;

create policy "termos_service_role_all"
  on public.termos
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- Nenhuma policy para anon. Por padrao no Postgres com RLS ativa, ausencia de
-- policy = nega tudo. Selects via cliente anon retornam 0 linhas.
