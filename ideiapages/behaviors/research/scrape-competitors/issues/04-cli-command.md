---
issue: 04-cli-command
behavior: research/scrape-competitors
fase: fase-0-research-pipeline
status: pending
depends_on: [research/scrape-competitors/03-scraper-logic]
---

# Issue 04 — Comando CLI Typer para scrape-competitors

## Objetivo
Expor o scraper via CLI, com batch sobre snapshots e proteções de custo.

## Critérios de aceitação
- [ ] Comando `ideiapages-research scrape-competitors` registrado
- [ ] Flags: `--snapshot-id <uuid>` (single snapshot), `--all-pending` (batch sobre todos snapshots de termos com status `snapshot_serp_ok`), `--max-concurrent N` (default 3), `--limit N` (cap no batch, default 20 termos), `--dry-run`, `--force`
- [ ] Resumo: snapshots processados, URLs raspadas, sucesso, falhas, paywalled, thin, custo total
- [ ] Alerta de custo: pede confirmação se estimativa > R$ 20 antes de começar
- [ ] Log JSON em `research/data/logs/scrape-competitors-<timestamp>.jsonl`

## Notas para o agente
- Path: adicionar ao `research/src/ideiapages_research/cli.py`
- Documentar exemplo: `ideiapages-research scrape-competitors --all-pending --limit 20`

## Não fazer aqui
- Lógica de scraping (issue 03)
- Re-scrape automático (Fase 4)
