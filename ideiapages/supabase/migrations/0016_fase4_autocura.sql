-- Fase 4 — Autocura: métricas GSC por página/query, fila de rewrites, auditoria, estado de pausa

-- Métricas diárias do Search Console (por página + consulta) — alimenta detect-ranking-drop
CREATE TABLE public.gsc_metricas_diarias (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id     uuid        NOT NULL REFERENCES public.paginas (id) ON DELETE CASCADE,
  data          date        NOT NULL,
  query         text        NOT NULL,
  impressoes    integer     NOT NULL DEFAULT 0,
  cliques       integer     NOT NULL DEFAULT 0,
  posicao_media numeric(8,4) NOT NULL DEFAULT 0,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_gsc_metricas_pagina_data_query
  ON public.gsc_metricas_diarias (pagina_id, data, query);

CREATE INDEX idx_gsc_metricas_pagina_data ON public.gsc_metricas_diarias (pagina_id, data DESC);

COMMENT ON TABLE public.gsc_metricas_diarias IS
  'Dados GSC (Search Analytics) por URL de página e query; usado na autocura e no dashboard.';

-- Fila de rewrites automáticos
CREATE TABLE public.auto_rewrite_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id       uuid        NOT NULL REFERENCES public.paginas (id) ON DELETE CASCADE,
  termo_id        uuid        REFERENCES public.termos (id) ON DELETE SET NULL,
  status          text        NOT NULL DEFAULT 'pendente'
    CHECK (status IN (
      'pendente',
      'em_processamento',
      'aguarda_cli',
      'concluido',
      'falhou',
      'cancelado'
    )),
  prioridade      smallint    NOT NULL DEFAULT 5 CHECK (prioridade >= 1 AND prioridade <= 10),
  razao           text        NOT NULL,
  detalhe_jsonb   jsonb       NULL,
  snapshot_serp_id uuid     REFERENCES public.serp_snapshots (id) ON DELETE SET NULL,
  erro_mensagem   text        NULL,
  custo_brl       numeric(12,4) NULL,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  iniciado_em     timestamptz NULL,
  concluido_em    timestamptz NULL
);

-- Uma fila ativa por página
CREATE UNIQUE INDEX idx_auto_rewrite_um_ativo
  ON public.auto_rewrite_queue (pagina_id)
  WHERE status IN ('pendente', 'em_processamento', 'aguarda_cli');

CREATE INDEX idx_auto_rewrite_status_criado
  ON public.auto_rewrite_queue (status, criado_em);

-- Trilha de auditoria
CREATE TABLE public.automation_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  behavior    text        NOT NULL,
  pagina_id   uuid        NULL REFERENCES public.paginas (id) ON DELETE SET NULL,
  detalhe     jsonb       NULL,
  resultado   jsonb       NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_log_behavior ON public.automation_log (behavior, criado_em DESC);
CREATE INDEX idx_automation_log_pagina ON public.automation_log (pagina_id, criado_em DESC);

-- Estado global (linha única)
CREATE TABLE public.automation_state (
  id                  smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  automations_paused  boolean  NOT NULL DEFAULT false,
  pause_reason        text     NULL,
  custo_dia_brl       numeric(12,4) NOT NULL DEFAULT 0,
  custo_dia_referencia date    NULL,
  max_rewrites_por_pagina_30d smallint NOT NULL DEFAULT 1,
  custo_max_dia_brl   numeric(12,4) NOT NULL DEFAULT 50,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.automation_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS: acesso server-side via service_role (padrão do painel)
ALTER TABLE public.gsc_metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_rewrite_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY gsc_metricas_service_role_all ON public.gsc_metricas_diarias
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY auto_rewrite_queue_service_role_all ON public.auto_rewrite_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY automation_log_service_role_all ON public.automation_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY automation_state_service_role_all ON public.automation_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);
