-- migration: 0007_paginas
-- Tabela de páginas SEO piloto (Fase 1).

CREATE TABLE paginas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  termo_id        uuid        REFERENCES termos(id) ON DELETE SET NULL,
  slug            text        UNIQUE NOT NULL,
  titulo          text        NOT NULL,
  subtitulo       text,
  corpo_mdx       text        NOT NULL DEFAULT '',
  meta_title      text,
  meta_description text,
  og_image_url    text,
  faq_jsonb       jsonb,
  cta_whatsapp_texto text     NOT NULL DEFAULT 'Falar com especialista',
  status          text        NOT NULL DEFAULT 'rascunho'
                              CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  publicado_em    timestamptz,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

-- Índices de busca por slug e status (hot paths)
CREATE INDEX idx_paginas_slug   ON paginas (slug);
CREATE INDEX idx_paginas_status ON paginas (status);
CREATE INDEX idx_paginas_termo  ON paginas (termo_id);

-- Função para manter atualizado_em sincronizado
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_paginas_atualizado_em
  BEFORE UPDATE ON paginas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- RLS
ALTER TABLE paginas ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas para páginas publicadas
CREATE POLICY paginas_select_publicadas ON paginas
  FOR SELECT
  USING (status = 'publicado');

-- Escrita exclusiva via service_role (sem acesso anon/authenticated direto)
CREATE POLICY paginas_service_role_all ON paginas
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
