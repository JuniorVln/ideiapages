-- =============================================================================
-- Migration: 0006_shared_triggers
-- Issue:     research/data-model/05-shared-triggers-rls-types
-- Fase:      fase-0-research-pipeline
-- Intencao:  Funcao e trigger compartilhados para manter updated_at em tabelas mutaveis.
--            (Hoje: apenas public.termos.)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists termos_set_updated_at on public.termos;

create trigger termos_set_updated_at
  before update on public.termos
  for each row
  execute function public.set_updated_at();

comment on function public.set_updated_at() is
  'Atualiza updated_at antes de UPDATE; usar em tabelas com coluna updated_at.';
