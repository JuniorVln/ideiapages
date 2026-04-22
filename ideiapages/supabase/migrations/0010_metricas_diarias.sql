-- migration: 0010_metricas_diarias
-- Métricas diárias por página (para dashboard na Fase 3; estruturada agora).

CREATE TABLE metricas_diarias (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id           uuid        NOT NULL REFERENCES paginas(id) ON DELETE CASCADE,
  data                date        NOT NULL,
  sessoes             integer     NOT NULL DEFAULT 0,
  pageviews           integer     NOT NULL DEFAULT 0,
  leads               integer     NOT NULL DEFAULT 0,
  cliques_whatsapp    integer     NOT NULL DEFAULT 0,
  ctr_whatsapp        numeric(6,4) GENERATED ALWAYS AS (
    CASE WHEN pageviews > 0
      THEN cliques_whatsapp::numeric / pageviews
      ELSE 0
    END
  ) STORED,
  taxa_conversao      numeric(6,4) GENERATED ALWAYS AS (
    CASE WHEN sessoes > 0
      THEN leads::numeric / sessoes
      ELSE 0
    END
  ) STORED,
  criado_em           timestamptz NOT NULL DEFAULT now()
);

-- Garante uma linha por (página, dia) — upsert por data
CREATE UNIQUE INDEX idx_metricas_pagina_data ON metricas_diarias (pagina_id, data);

-- RLS
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY metricas_select_public ON metricas_diarias
  FOR SELECT USING (true);

CREATE POLICY metricas_service_role_all ON metricas_diarias
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
