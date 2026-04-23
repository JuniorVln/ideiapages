-- migration: 0008_variacoes
-- Variações de página (estrutura para A/B na Fase 2; criada agora para não migrar depois).

CREATE TABLE variacoes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id   uuid        NOT NULL REFERENCES paginas(id) ON DELETE CASCADE,
  nome        text        NOT NULL DEFAULT 'controle',
  corpo_mdx   text,           -- null = usa o corpo da página principal
  ativa       boolean     NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variacoes_pagina ON variacoes (pagina_id);

-- Cria variação "controle" automaticamente quando uma nova página é inserida
CREATE OR REPLACE FUNCTION criar_variacao_controle()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO variacoes (pagina_id, nome, ativa)
  VALUES (NEW.id, 'controle', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_paginas_criar_variacao_controle
  AFTER INSERT ON paginas
  FOR EACH ROW EXECUTE FUNCTION criar_variacao_controle();

-- RLS
ALTER TABLE variacoes ENABLE ROW LEVEL SECURITY;

-- Leitura anon: apenas variações cuja página pai está publicada
CREATE POLICY variacoes_select_publicadas ON variacoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM paginas p
      WHERE p.id = variacoes.pagina_id
        AND p.status = 'publicado'
    )
  );

CREATE POLICY variacoes_service_role_all ON variacoes
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
