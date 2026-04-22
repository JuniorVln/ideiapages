---
issue: 03-scraper-logic
behavior: research/scrape-competitors
fase: fase-0-research-pipeline
status: pending
depends_on: [research/scrape-competitors/02-content-extractor]
---

# Issue 03 — Orquestração: concorrência, cache, persistência

## Objetivo
Compor wrapper Firecrawl + extractor para raspar concorrentes de um snapshot SERP em paralelo (limite 3 conc.), respeitando cache e persistindo em `conteudo_concorrente`.

## Critérios de aceitação
- [ ] Função `scrape_competitors_for_snapshot(snapshot_id: UUID, max_concurrent: int = 3, dry_run: bool, force: bool) -> ScrapeBatchReport`
- [ ] Lê `serp_snapshots` do snapshot, pega URLs únicas
- [ ] Cache de 30 dias por URL (consulta `conteudo_concorrente.raspado_em`); `force=True` ignora
- [ ] Roda scraping em paralelo com `asyncio.Semaphore(max_concurrent)` para respeitar rate limit Firecrawl
- [ ] Para cada URL: scrape → extract → upsert em `conteudo_concorrente` (unique por (snapshot_id, url))
- [ ] Falhas individuais não interrompem o batch — registra erro e continua
- [ ] Páginas marcadas como `thin`, `paywalled` ou `truncated` SÃO persistidas (precisamos ver mesmo páginas ruins para análise de gap)
- [ ] Atualiza `termos.status='scraped'` quando todas URLs do snapshot foram tentadas
- [ ] Registra métrica em `metricas_coleta` (custo total, sucesso, falhas, paywalled, thin)
- [ ] Salva markdown cru em `research/data/raw/scrape/<url_hash>.md` (gitignored)

## Notas para o agente
- Path: `research/src/ideiapages_research/behaviors/scrape_competitors/scraper.py`
- Async: usar `asyncio` + `httpx` (Firecrawl SDK pode ser sync — wrapping com `asyncio.to_thread` se necessário)
- URL normalization: lowercase host, remove fragment, remove query params de tracking (utm_*, fbclid)
- Latência target: ≤ 5 min para 10 URLs com `max_concurrent=3`

## Não fazer aqui
- CLI command (issue 04)
- Análise semântica do conteúdo (vai para `analyze-gaps`)
- Re-scrape periódico (vira responsabilidade de behavior na Fase 4)
