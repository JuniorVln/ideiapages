---
issue: 01-types-and-client
behavior: research/scrape-competitors
fase: fase-0-research-pipeline
status: pending
depends_on: [research/collect-serp/03-cli-command]
---

# Issue 01 — Tipos Pydantic + wrapper Firecrawl

## Objetivo
Definir tipos do conteúdo raspado e implementar wrapper do Firecrawl com retry, timeout e tratamento de paywall/SPA.

## Critérios de aceitação
- [ ] Pydantic models criados em `research/src/ideiapages_research/types/competitor.py`: `CompetitorContent`, `ScrapedPage`, `ScrapeInput`, `ScrapeResult`
- [ ] Wrapper `FirecrawlClient` em `research/src/ideiapages_research/clients/firecrawl.py` (criar) com método `scrape(url, formats=['markdown'], wait_for_selector=None, timeout_ms=30000) -> ScrapedPage | None`
- [ ] Suporte aos formatos: `markdown`, `html` (raw), `metadata`
- [ ] Retry exponencial em 5xx (até 2 tentativas); 4xx não retry (página realmente quebrada)
- [ ] Detecção de paywall: heurística simples (markdown < 500 chars + presença de palavras como "subscribe", "paywall", "assine") → marca `paywalled=true`
- [ ] Detecção de truncamento: response Firecrawl indica truncamento → marca `truncated=true`
- [ ] Custo estimado por scrape exposto

## Notas para o agente
- Firecrawl SDK Python: `firecrawl-py`. Validar versão recente.
- API key vem de `FIRECRAWL_API_KEY` no env
- Documentar limites do plano contratado (ex: scrapes/mês) no docstring do client
- Custo Firecrawl: aproximadamente R$ 0,01-0,03 por URL no plano starter

## Não fazer aqui
- Lógica de extração estrutural (headings, FAQ) — issue 02
- Persistência em `conteudo_concorrente` — issue 03
- CLI command — issue 04
