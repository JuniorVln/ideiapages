-- =============================================================================
-- Migration: 0019_autoridade_dominio
-- Intenção:  Série histórica de autoridade de domínio (nossa e dos comparáveis).
--            Pedido do Victor em 12/08/2026: parar de olhar foto e acompanhar
--            o indicador subindo/descendo ao longo do tempo, no dashboard.
-- Author:    Claude (sessão HQ 09/09/2026)
-- =============================================================================

create table if not exists public.autoridade_dominio (
  id                  uuid primary key default gen_random_uuid(),
  dominio             text not null,
  data                date not null,
  fonte               text not null default 'openpagerank',
  rank_decimal        numeric(4,2),
  rank_posicao        integer,
  dominios_referentes integer,
  detalhe             jsonb,
  coletado_em         timestamptz not null default now(),
  criado_em           timestamptz not null default now(),

  constraint autoridade_dominio_dominio_len_chk
    check (char_length(trim(dominio)) > 0),

  -- 'openpagerank' = coleta automática (escala 0-10).
  -- 'ahrefs_manual'/'manual' = leitura digitada (DR, domínios referentes).
  constraint autoridade_dominio_fonte_chk
    check (fonte in ('openpagerank', 'ahrefs_manual', 'manual')),

  constraint autoridade_dominio_rank_range_chk
    check (rank_decimal is null or (rank_decimal >= 0 and rank_decimal <= 100)),

  constraint autoridade_dominio_unico
    unique (dominio, data, fonte)
);

create index if not exists autoridade_dominio_data_idx
  on public.autoridade_dominio (data desc);

create index if not exists autoridade_dominio_dominio_data_idx
  on public.autoridade_dominio (dominio, data desc);

comment on table public.autoridade_dominio is
  'Snapshots de autoridade de domínio por data e fonte. Automático via Open PageRank (0-10, coluna rank_decimal) e manual para DR/domínios referentes lidos no Ahrefs Webmaster Tools. Escalas diferentes NÃO se comparam entre si: sempre ler junto com a coluna fonte.';

comment on column public.autoridade_dominio.rank_decimal is
  'Valor da autoridade na escala da fonte (Open PageRank: 0-10; ahrefs_manual: DR 0-100).';

comment on column public.autoridade_dominio.rank_posicao is
  'Posição global do domínio no ranking da fonte, quando existir (Open PageRank devolve).';

comment on column public.autoridade_dominio.dominios_referentes is
  'Domínios referentes (backlinks únicos). Hoje só é preenchido em leitura manual.';

alter table public.autoridade_dominio enable row level security;

drop policy if exists "autoridade_dominio_service_role_all"
  on public.autoridade_dominio;

create policy "autoridade_dominio_service_role_all"
  on public.autoridade_dominio
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
