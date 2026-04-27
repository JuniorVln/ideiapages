-- =============================================================================
-- OAuth Google (Search Console API) — refresh token por utilizador admin
-- =============================================================================

create table if not exists public.admin_google_oauth (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  criado_em     timestamptz not null default now(),
  actualizado_em timestamptz not null default now()
);

comment on table public.admin_google_oauth is
  'Refresh token OAuth (Google Search Console) por utilizador admin; acesso só via service_role.';

create index if not exists admin_google_oauth_actualizado_em_idx
  on public.admin_google_oauth (actualizado_em desc);

alter table public.admin_google_oauth enable row level security;

drop policy if exists "admin_google_oauth_service_role_all" on public.admin_google_oauth;

create policy "admin_google_oauth_service_role_all"
  on public.admin_google_oauth
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
