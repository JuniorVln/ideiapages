-- =============================================================================
-- Migration: 0011_fase1_web_hardening
-- Issue:     web/data-model — correções para ambientes que já rodaram 0007–0010
-- Intenção:  1) Remover índice parcial inválido em leads (now() no predicado).
--            2) Garantir trigger de dedup 5 min.
--            3) Restringir RLS de variacoes e metricas_diarias a páginas publicadas.
-- =============================================================================

-- --- leads: índice idx_leads_dedup era inválido (now() fixo na criação do índice)
DROP INDEX IF EXISTS idx_leads_dedup;

CREATE OR REPLACE FUNCTION public.leads_block_duplicate_5min()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.leads
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

DROP TRIGGER IF EXISTS trg_leads_block_dup_5min ON public.leads;
CREATE TRIGGER trg_leads_block_dup_5min
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_block_duplicate_5min();

-- --- variacoes: troca policy permissiva por join à página publicada
DROP POLICY IF EXISTS variacoes_select_public ON public.variacoes;
DROP POLICY IF EXISTS variacoes_select_publicadas ON public.variacoes;

CREATE POLICY variacoes_select_publicadas
  ON public.variacoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.paginas p
      WHERE p.id = variacoes.pagina_id
        AND p.status = 'publicado'
    )
  );

-- --- metricas_diarias: idem
DROP POLICY IF EXISTS metricas_select_public ON public.metricas_diarias;
DROP POLICY IF EXISTS metricas_select_publicadas ON public.metricas_diarias;

CREATE POLICY metricas_select_publicadas
  ON public.metricas_diarias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.paginas p
      WHERE p.id = metricas_diarias.pagina_id
        AND p.status = 'publicado'
    )
  );
