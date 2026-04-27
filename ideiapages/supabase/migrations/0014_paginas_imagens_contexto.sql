-- Contexto semântico para buscas Pexels (hero + inline), preenchido no compose a partir do briefing.
alter table public.paginas
  add column if not exists imagens_contexto_jsonb jsonb null;

comment on column public.paginas.imagens_contexto_jsonb is
  'Queries temáticas para imagens: {"hero_query": "...", "inline_query": "..."} alinhadas ao keyword e LSI do briefing.';
