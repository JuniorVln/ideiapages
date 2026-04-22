---
issue: 03-cli-command
behavior: research/classify-terms
fase: fase-0-research-pipeline
status: pending
depends_on: [research/classify-terms/02-types-and-classifier]
---

# Issue 03 — Comando CLI Typer para classify-terms

## Objetivo
Expor o classifier via CLI, com batches automáticos, controle de custo e suporte a re-classificação.

## Critérios de aceitação
- [ ] Comando `ideiapages-research classify-terms` registrado
- [ ] Flags: `--batch-size N` (default 50, máx 200), `--max-batches N` (default 10, proteção de custo), `--prompt-version N` (default última), `--reclassify` (force-update mesmo se já analisado), `--where <sql>` (filtro adicional avançado), `--dry-run`
- [ ] Loop: busca até `batch_size * max_batches` termos com `status='coletado'` (ou `--reclassify`), processa em batches sequenciais
- [ ] Alerta no stdout se custo acumulado passar de R$ 50 em uma execução (perguntar confirmação ou abortar conforme env `CONFIRM_HIGH_COST`)
- [ ] Resumo final: total processado, sucesso, falhas, custo total acumulado, distribuição de scores (histograma 1-10), top 5 clusters identificados
- [ ] Log JSON em `research/data/logs/classify-terms-<timestamp>.jsonl`

## Notas para o agente
- Path: adicionar ao `research/src/ideiapages_research/cli.py`
- Usar `rich.table` para o histograma de scores no resumo
- `--reclassify` exige confirmação interativa por padrão (proteção contra desperdício de tokens)
- Documentar exemplo no `--help`: `ideiapages-research classify-terms --batch-size 50 --max-batches 4`

## Não fazer aqui
- Implementação do classifier (issue 02)
- Edição manual de classificações (não é função desta CLI; humano faz no Supabase Studio)
