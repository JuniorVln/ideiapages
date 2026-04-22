---
issue: 03-cli-command
behavior: research/collect-serp
fase: fase-0-research-pipeline
status: pending
depends_on: [research/collect-serp/02-collector-logic]
---

# Issue 03 — Comando CLI Typer para collect-serp

## Objetivo
Expor o snapshotter SERP via CLI, com modo single e batch sobre termos priorizados.

## Critérios de aceitação
- [ ] Comando `ideiapages-research collect-serp` registrado
- [ ] Flags: `--keyword <string>` (single), `--all-priorizados` (batch), `--top-n N` (default 10), `--limit N` (cap no batch, default 30), `--pause-seconds N` (default 3, anti-rate-limit), `--dry-run`, `--force`
- [ ] Modo batch: processa todos termos com `status='priorizado'` (ou `status='analisado'` se sinalizado por flag `--include-analisado`)
- [ ] Resumo final: termos processados, snapshots criados, custo total estimado, falhas, alertas (ex: termos sem nenhum resultado, possível indicador de problema)
- [ ] Log JSON em `research/data/logs/collect-serp-<timestamp>.jsonl`

## Notas para o agente
- Path: adicionar ao `research/src/ideiapages_research/cli.py`
- Alerta de custo: avisar antes de iniciar batch grande (ex: 30 termos × R$ 0,08 = R$ 2,40); pedir confirmação se > R$ 10
- Documentar exemplo: `ideiapages-research collect-serp --all-priorizados --limit 30 --top-n 10`

## Não fazer aqui
- Lógica do collector (issue 02)
- Análise comparativa cross-snapshot (vira behavior de monitoring na Fase 4)
