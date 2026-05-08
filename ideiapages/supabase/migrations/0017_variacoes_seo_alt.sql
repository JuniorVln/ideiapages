-- Migration 0017: Adiciona colunas de SEO alternativo e erros de qualidade na tabela variacoes
-- Objetivo: Resolver erros de geração de variações A/B

ALTER TABLE public.variacoes 
ADD COLUMN IF NOT EXISTS titulo_alt text,
ADD COLUMN IF NOT EXISTS meta_description_alt text,
ADD COLUMN IF NOT EXISTS quality_gate_errors text[];

-- Comentários para documentação
COMMENT ON COLUMN public.variacoes.titulo_alt IS 'Título SEO sugerido pela IA para esta variação';
COMMENT ON COLUMN public.variacoes.meta_description_alt IS 'Meta description sugerida pela IA para esta variação';
COMMENT ON COLUMN public.variacoes.quality_gate_errors IS 'Lista de erros encontrados pelo Quality Gate durante a geração';
