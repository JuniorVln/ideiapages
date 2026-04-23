-- migration: 0009_leads
-- Leads capturados pelas páginas piloto.
-- Acesso client BLOQUEADO — inserção apenas via route handler com service_role.

CREATE TABLE leads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id       uuid        REFERENCES paginas(id) ON DELETE SET NULL,
  variacao_id     uuid        REFERENCES variacoes(id) ON DELETE SET NULL,
  nome            text        NOT NULL,
  email           text        NOT NULL,
  telefone        text        NOT NULL,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  ip_hash         text,           -- SHA-256 do IP (LGPD)
  user_agent_hash text,           -- SHA-256 do User-Agent (LGPD)
  criado_em       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_pagina   ON leads (pagina_id);
CREATE INDEX idx_leads_email    ON leads (email);
CREATE INDEX idx_leads_criado   ON leads (criado_em);

-- Deduplicação em janela de 5 min (índice parcial com now() é inválido — usar trigger)
CREATE OR REPLACE FUNCTION leads_block_duplicate_5min()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE email = NEW.email
      AND telefone = NEW.telefone
      AND pagina_id IS NOT DISTINCT FROM NEW.pagina_id
      AND criado_em > now() - interval '5 minutes'
  ) THEN
    RAISE EXCEPTION 'lead_duplicate_within_5min'
      USING ERRCODE = '23505',
            HINT = 'Mesmo email+telefone+pagina_id em menos de 5 minutos';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leads_block_dup_5min
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_block_duplicate_5min();

-- RLS: nenhum acesso via client (anon ou authenticated)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_no_client_access ON leads
  FOR ALL USING (false);

CREATE POLICY leads_service_role_all ON leads
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
