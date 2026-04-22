---

## issue: 02-types-and-summarizer
behavior: research/analyze-gaps
fase: fase-0-research-pipeline
status: pending
depends_on: [research/analyze-gaps/01-prompt-template]

# Issue 02 — Tipos Pydantic + summarizer extrativo de concorrentes

## Objetivo

Definir o schema completo do briefing como Pydantic (validação rigorosa) e implementar o summarizer extrativo que comprime o markdown bruto de cada concorrente em um resumo barato (sem LLM) para alimentar o prompt.

## Critérios de aceitação

- Pydantic models em `research/src/ideiapages_research/types/briefing.py`: `BriefingSEO` (full schema do prompt v1), `H2Block`, `FAQItem`, `EvidenciaExterna`, `CompetitorSummary`
- Validators Pydantic: `title_seo` ≤ 60 chars, `meta_description` ≤ 155 chars, `word_count_alvo` ≥ 300, todos campos obrigatórios presentes
- Função `summarize_competitor(content: CompetitorContent) -> CompetitorSummary` implementada
- Summary contém: url, titulo, word_count, headings_h2, headings_h3 (até 20), trecho dos primeiros 500 chars, presença de FAQ/tabela
- Função `summarize_competitors_for_term(termo_id: UUID, top_n: int = 10) -> list[CompetitorSummary]` que busca todos os `conteudo_concorrente` ligados ao snapshot mais recente do termo, ordena por posição na SERP, retorna top N
- Filtra automaticamente: páginas `thin=true` e `paywalled=true` (não úteis para Information Gain)
- Tests para o summarizer: dado um markdown sintético com 1500 palavras, retorna summary < 800 tokens

## Notas para o agente

- Path do summarizer: `research/src/ideiapages_research/behaviors/analyze_gaps/summarizer.py`
- Compressão extrativa = SEM LLM, só recortes determinísticos. Isso baixa o custo do prompt principal de R$ 5+ para < R$ 1
- Estimar tokens dos summaries antes de mandar pro LLM — alertar se passar de ~30k tokens (limita a top_n menor automaticamente)

## Não fazer aqui

- Chamada Claude / análise de gaps — issue 03
- CLI command — issue 04
- Resumo via LLM (rejeitado por custo neste MVP)