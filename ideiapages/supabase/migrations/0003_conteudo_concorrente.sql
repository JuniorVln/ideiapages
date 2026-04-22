-- =============================================================================
-- Migration: 0003_conteudo_concorrente
-- Issue:     research/data-model/02-snapshots-and-content
-- Fase:      fase-0-research-pipeline
-- Intencao:  Markdown e metadados estruturais raspados por URL de um snapshot SERP.
-- =============================================================================

create table if not exists public.conteudo_concorrente (
  id                 uuid primary key default gen_random_uuid(),
  snapshot_id        uuid not null references public.serp_snapshots (id) on delete cascade,
  url                text not null,
  markdown           text not null default '',
  word_count         integer not null default 0,
  headings_h2        text[] not null default '{}',
  headings_h3        text[] not null default '{}',
  tem_faq            boolean not null default false,
  tem_tabela         boolean not null default false,
  tem_imagem         boolean not null default false,
  idioma_detectado   text,
  thin               boolean not null default false,
  truncated          boolean not null default false,
  paywalled          boolean not null default false,
  raspado_em         timestamptz not null default now(),

  constraint conteudo_concorrente_idioma_chk
    check (
      idioma_detectado is null
      or (char_length(idioma_detectado) between 2 and 5)
    ),

  constraint conteudo_concorrente_snapshot_url_uniq
    unique (snapshot_id, url)
);

create index if not exists conteudo_concorrente_snapshot_id_idx
  on public.conteudo_concorrente (snapshot_id);
create index if not exists conteudo_concorrente_raspado_em_idx
  on public.conteudo_concorrente (raspado_em desc);

comment on table public.conteudo_concorrente is
  'Conteudo concorrente em markdown + extracao estrutural (Firecrawl).';

alter table public.conteudo_concorrente enable row level security;

drop policy if exists "conteudo_concorrente_service_role_all" on public.conteudo_concorrente;

create policy "conteudo_concorrente_service_role_all"
  on public.conteudo_concorrente
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
