---
issue: 03-cli-command
behavior: research/collect-trends
fase: fase-0-research-pipeline
status: done
depends_on: [research/collect-trends/02-trends-analyzer]
---

# Issue 03 — Comando CLI Typer para collect-trends

## Objetivo
Expor o behavior via CLI Typer, suportando análise de tendência por keyword única ou em lote sobre todos os termos com `status='analisado'`.

## Critérios de aceitação
- [x] Comando `ideiapages-research collect-trends` registrado
- [x] Modo single: `--keyword <string>` analisa essa keyword (cria registro em `termos` se não existir, com `fonte='manual_trends'`)
- [x] Modo batch: sem `--keyword`, processa `termos` com `status='analisado'` e tendência ausente ou cache > 30 dias
- [x] Flags: `--limit N` (max keywords no batch, default 50), `--pause-seconds N` (default 5, anti-ban), `--dry-run`, `--force`, `--geo`, `--timeframe`
- [x] Tratamento de `PyTrendsBannedError`: pausar 5 min, retentar; se persistir, interromper lote com resumo
- [x] Resumo no stdout: contadores (processados, com dados, no_data, falhas, crescente/estável/decrescente); custo R$ 0,00 explícito
- [x] Log JSON em `research/data/logs/collect-trends-<timestamp>.jsonl`

## Notas para o agente
- Path: adicionar ao `research/src/ideiapages_research/cli.py`
- Usar `rich.progress` para barra de progresso no batch (importante porque pausa de 5s entre keywords torna 50 keywords = ~5 min)
- Custo: sempre R$ 0,00 — exibir explicitamente no resumo para reforçar

## Não fazer aqui
- Lógica de análise (já em issue 02)
- Migração para Apify Google Trends actor (fica como plano B documentado)
