---
issue: 03-cli-command
behavior: research/collect-autocomplete
fase: fase-0-research-pipeline
status: done
depends_on: [research/collect-autocomplete/02-collector-logic]
---

# Issue 03 — Comando CLI Typer para collect-autocomplete

## Objetivo
Expor o behavior via CLI Typer, suportando coleta para um seed individual e em lote a partir do seed file JSON.

## Critérios de aceitação
- [x] Comando `ideiapages-research collect-autocomplete` registrado no Typer app principal
- [x] Subcomando ou flags: `--seed <string>` (single), `--seed-file <path>` (batch), `--limit N`, `--geo BR`, `--lang pt-BR`, `--dry-run`, `--force`
- [x] Validação de input: pelo menos um entre `--seed` ou `--seed-file` é obrigatório (mutuamente exclusivos)
- [x] Lote: lê arquivo JSON com schema `{"seeds_termos": [string]}`, processa cada seed sequencialmente com pausa configurável (`--pause-seconds`, default 2)
- [x] Falha em um seed do lote NÃO interrompe os demais — registra erro e continua
- [x] Resumo final no stdout: total coletado, novos, duplicados, descartados, custo total estimado, falhas
- [x] Log estruturado JSON salvo em `research/data/logs/collect-autocomplete-<timestamp>.jsonl`
- [x] Comando `ideiapages-research collect-autocomplete --help` mostra opções claras e exemplo de uso

## Notas para o agente
- Path: `research/src/ideiapages_research/cli.py` (já existe — adicionar comando)
- Usar `rich` para output bonito (tabela de resumo no fim)
- `--seed-file` valida schema antes de começar (erro early se arquivo malformado)
- Considerar `--max-seeds N` para limitar quantos seeds processar do arquivo (proteção em testes)

## Não fazer aqui
- Lógica de coleta em si (já implementada em issue 02)
- Mudança no schema do seed file — manter `seeds_termos` para compatibilidade com `seeds/ideia_chat.json`
