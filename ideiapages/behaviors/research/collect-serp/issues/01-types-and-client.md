---
issue: 01-types-and-client
behavior: research/collect-serp
fase: fase-0-research-pipeline
status: pending
depends_on: [research/data-model/05-shared-triggers-rls-types]
---

# Issue 01 — Tipos Pydantic + wrapper Apify para SERP

## Objetivo
Definir tipos da SERP e implementar wrapper do actor Apify de Google Search (top N orgânicos).

## Critérios de aceitação
- [ ] Pydantic models criados em `research/src/ideiapages_research/types/serp.py`: `SerpResult`, `SerpSnapshot`, `SerpCollectInput`, `SerpCollectResult`
- [ ] Wrapper `ApifySerpClient` (em `clients/apify.py`) com método `collect(keyword, geo='BR', lang='pt-BR', top_n=10) -> SerpSnapshot`
- [ ] Resultado inclui posicao (1-N), url, titulo, meta_description, raw (jsonb com tudo que veio)
- [ ] Filtra ads, knowledge panel, featured snippets em campo separado (não conta como posição orgânica)
- [ ] Captura também: `paa_questions` (se vier no payload), `related_searches`, `featured_snippet` (se houver)
- [ ] Retry exponencial em 429/5xx, timeout configurável
- [ ] Custo estimado por chamada exposto

## Notas para o agente
- Reusar o cliente Apify base se possível (compartilhar config, cliente HTTP)
- Actor sugerido: `apify/google-search-scraper` — confirmar disponibilidade e custo no Apify Store antes de codar
- `top_n` máximo: 50 (mas default 10 — o que o pipeline realmente precisa)
- Documentar formato do `raw_jsonb` esperado em comentário no Pydantic

## Não fazer aqui
- Lógica de persistência em `serp_snapshots` — issue 02
- CLI command — issue 03
- Scraping do conteúdo dessas URLs — fica para `scrape-competitors`
