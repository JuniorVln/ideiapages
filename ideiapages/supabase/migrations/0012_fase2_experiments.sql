-- Fase 2: A/B multi-IA — colunas em variacoes/paginas, tabela experimentos, métricas por braço.

-- 1) Variações: proveniência e custo de geração
ALTER TABLE public.variacoes
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'controle'
    CONSTRAINT variacoes_provider_chk CHECK (provider IN ('controle', 'claude', 'gpt', 'gemini')),
  ADD COLUMN IF NOT EXISTS prompt_version text NOT NULL DEFAULT '1',
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS tokens_input integer,
  ADD COLUMN IF NOT EXISTS tokens_output integer,
  ADD COLUMN IF NOT EXISTS custo_estimado_usd numeric(14, 6),
  ADD COLUMN IF NOT EXISTS peso_trafego integer NOT NULL DEFAULT 1
    CONSTRAINT variacoes_peso_chk CHECK (peso_trafego >= 1);

COMMENT ON COLUMN public.variacoes.provider IS 'controle = braço base (corpo da página pai se corpo_mdx nulo).';

UPDATE public.variacoes SET provider = 'controle' WHERE nome = 'controle';

-- 2) Página: estado do experimento
ALTER TABLE public.paginas
  ADD COLUMN IF NOT EXISTS status_experimento text NOT NULL DEFAULT 'inativo'
    CONSTRAINT paginas_status_exp_chk CHECK (
      status_experimento IN ('inativo', 'ativo', 'vencedor_declarado', 'encerrado')
    ),
  ADD COLUMN IF NOT EXISTS variacao_vencedora_id uuid
    REFERENCES public.variacoes (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_paginas_status_exp ON public.paginas (status_experimento);

-- 3) Histórico de experimentos (um ativo por página)
CREATE TABLE IF NOT EXISTS public.experimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  pagina_id uuid NOT NULL REFERENCES public.paginas (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ativo'
    CONSTRAINT experimentos_status_chk CHECK (
      status IN ('ativo', 'vencedor_declarado', 'encerrado')
    ),
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  encerrado_em timestamptz,
  vencedor_variacao_id uuid REFERENCES public.variacoes (id) ON DELETE SET NULL,
  p_value numeric (14, 10),
  lift numeric (14, 6),
  amostra_total integer,
  notas text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experimentos_pagina ON public.experimentos (pagina_id);
CREATE INDEX IF NOT EXISTS idx_experimentos_status ON public.experimentos (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_experimentos_um_ativo_por_pagina
  ON public.experimentos (pagina_id)
  WHERE status = 'ativo';

ALTER TABLE public.experimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS experimentos_service_role_all ON public.experimentos;

CREATE POLICY experimentos_service_role_all ON public.experimentos FOR ALL USING (auth.role () = 'service_role')
WITH
  CHECK (auth.role () = 'service_role');

-- 4) Métricas diárias: braço opcional (NULL = rollup legado por página)
ALTER TABLE public.metricas_diarias
  ADD COLUMN IF NOT EXISTS variacao_id uuid REFERENCES public.variacoes (id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_metricas_pagina_data;

CREATE UNIQUE INDEX IF NOT EXISTS idx_metricas_rollup_pagina_data ON public.metricas_diarias (pagina_id, data)
WHERE
  variacao_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_metricas_variacao_data ON public.metricas_diarias (variacao_id, data)
WHERE
  variacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metricas_variacao ON public.metricas_diarias (variacao_id);

DROP POLICY IF EXISTS metricas_select_publicadas ON public.metricas_diarias;

CREATE POLICY metricas_select_publicadas ON public.metricas_diarias FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.paginas p
    WHERE
      p.id = metricas_diarias.pagina_id
      AND p.status = 'publicado'
  )
);
