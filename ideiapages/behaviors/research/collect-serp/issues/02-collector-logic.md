---
issue: 02-collector-logic
behavior: research/collect-serp
fase: fase-0-research-pipeline
status: pending
depends_on: [research/collect-serp/01-types-and-client]
---

# Issue 02 — Lógica do collector + persistência

## Objetivo
Implementar `snapshot_serp_for_term` que pega um termo, chama Apify SERP, persiste em `serp_snapshots` (uma linha por posição) e atualiza status do termo.

## Critérios de aceitação
- [ ] Função `snapshot_serp_for_term(termo: Termo, top_n: int = 10, dry_run: bool, force: bool) -> SerpSnapshotReport` implementada
- [ ] Cache de 14 dias por termo (consulta `serp_snapshots.capturado_em`); `force=True` ignora
- [ ] Filtra ads e exclui resultados que claramente são internos (configurável via env `EXCLUDE_DOMAINS`, ex: `redeideia.com.br`)
- [ ] Persiste cada resultado como uma linha em `serp_snapshots` (idempotente via `unique(termo_id, posicao, capturado_em)`)
- [ ] Atualiza `termos.status='snapshot_serp_ok'` ao final
- [ ] Salva o JSON cru em `research/data/raw/serp/<keyword_slug>-<timestamp>.json` (gitignored)
- [ ] Registra métrica em `metricas_coleta`
- [ ] `dry_run`: faz call mas não persiste
- [ ] Teste: rodar para uma keyword conhecida cria N linhas (N = top_n após filtros); rodar de novo dentro de 14 dias é skip

## Notas para o agente
- Path: `research/src/ideiapages_research/behaviors/collect_serp/collector.py`
- Status anterior esperado do termo: `priorizado` (humano marcou) OU `analisado` (se não houver priorização manual no MVP — discutir com usuário antes)
- Custo Apify SERP: aproximadamente R$ 0,05-0,10 por keyword. Importante registrar em `metricas_coleta.custo_brl`

## Não fazer aqui
- CLI command — issue 03
- Scraping do conteúdo das URLs — fica para `scrape-competitors`
