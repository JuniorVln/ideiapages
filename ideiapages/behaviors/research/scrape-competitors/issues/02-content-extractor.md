---
issue: 02-content-extractor
behavior: research/scrape-competitors
fase: fase-0-research-pipeline
status: pending
depends_on: [research/scrape-competitors/01-types-and-client]
---

# Issue 02 — Extrator estrutural (headings, FAQ, word_count, idioma)

## Objetivo
Dado um markdown raspado, extrair metadados estruturais: H2/H3, word_count, presença de FAQ/tabela/imagem, idioma detectado.

## Critérios de aceitação
- [ ] Função pura `extract_structure(markdown: str, url: str | None) -> ExtractedStructure` (Pydantic) implementada
- [ ] Campos extraídos: `headings_h2: list[str]`, `headings_h3: list[str]`, `word_count: int`, `tem_faq: bool`, `tem_tabela: bool`, `tem_imagem: bool`, `idioma_detectado: str`, `thin: bool` (true se word_count < 300)
- [ ] Detecção de FAQ: presença de seção H2/H3 contendo "FAQ", "Perguntas frequentes", "Dúvidas comuns" (case-insensitive, fuzzy)
- [ ] Detecção de tabela: presença de `|---|` ou tag `<table>` no markdown
- [ ] Detecção de imagem: presença de `![...](...)` ou `<img`
- [ ] Detecção de idioma: usar `langdetect` (lib leve); fallback para `unknown`
- [ ] Word count exclui blocos de código (`````) e markdown de imagens
- [ ] Função 100% testável via unit test (sem dep externa); incluir 5 casos de teste cobrindo: artigo bom, FAQ, página thin, página em inglês, página com paywall (markdown curto)

## Notas para o agente
- Path: `research/src/ideiapages_research/behaviors/scrape_competitors/extractor.py`
- Parsing markdown: usar regex para headings (rápido e suficiente — não precisa de parser AST completo)
- Tests obrigatórios em `research/tests/test_extractor.py`

## Não fazer aqui
- Chamada Firecrawl (issue 01)
- Lógica de concorrência/cache/persist (issue 03)
- CLI command (issue 04)
