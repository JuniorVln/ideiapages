---
issue: 04-cli-command
behavior: research/analyze-gaps
fase: fase-0-research-pipeline
status: pending
depends_on: [research/analyze-gaps/03-gaps-analyzer]
---

# Issue 04 — Comando CLI Typer para analyze-gaps

## Objetivo
Expor o analyzer via CLI, com batch sobre termos prontos, controle de custo agressivo (esta é a chamada mais cara do pipeline).

## Critérios de aceitação
- [ ] Comando `ideiapages-research analyze-gaps` registrado
- [ ] Flags: `--termo-id <uuid>` (single), `--all-scraped` (batch sobre todos com status `scraped`), `--limit N` (cap default 20, máx 100), `--top-n N` (concorrentes a considerar, default 10), `--prompt-version N`, `--dry-run`, `--force`
- [ ] Pré-flight: estima custo total antes de começar (N termos × R$ 0,80 ~ teto), exibe e pede confirmação interativa se > R$ 20 (ou se env `CONFIRM_HIGH_COST=true`)
- [ ] Loop com pausa entre termos (default 3s — Sonnet rate limit é generoso, mas evitar burst)
- [ ] Progresso: `rich.progress` com ETA
- [ ] Resumo final: termos analisados, briefings gerados, falhas, custo total real, distribuição de `word_count_alvo` (histograma), top alertas_para_humano agregados
- [ ] Log JSON em `research/data/logs/analyze-gaps-<timestamp>.jsonl`

## Notas para o agente
- Path: adicionar ao `research/src/ideiapages_research/cli.py`
- Documentar exemplo: `ideiapages-research analyze-gaps --all-scraped --limit 20 --top-n 10`
- Esta é a CLI mais "perigosa" em custo — output do `--help` deve ser explícito sobre isso

## Não fazer aqui
- Edição/aprovação dos briefings (humano faz no Supabase Studio ou dashboard futuro)
- Conversão briefing → página gerada (Fase 2)
- Quality gate automatizado (Fase 2)
