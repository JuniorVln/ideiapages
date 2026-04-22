---
issue: 02-collector-logic
behavior: research/collect-autocomplete
fase: fase-0-research-pipeline
status: done
depends_on: [research/collect-autocomplete/01-types-and-client]
---

# Issue 02 — Lógica do collector: dedup, normalização, persist

## Objetivo
Implementar a lógica central do behavior: receber seed → chamar autocomplete + PAA via clients → normalizar/deduplicar → persistir em `termos` → registrar métricas em `metricas_coleta`.

## Critérios de aceitação
- [x] Função `collect_for_seed(seed, limit, geo, lang, dry_run, force) -> CollectionReport` implementada
- [x] Normalização: lowercase, trim, remoção de acentos duplos, descarte de stopwords e termos < 2 chars
- [x] Deduplicação cross-fonte (autocomplete + PAA num único conjunto único)
- [x] Cache de 7 dias por seed (consulta `metricas_coleta` para ver execuções recentes); `force=True` ignora
- [x] Persistência em `termos` com `fonte='autocomplete'` ou `fonte='paa'`, `status='coletado'`, idempotente (select + insert)
- [x] Registro de métrica em `metricas_coleta` ao final (items_processados, items_sucesso, items_falha, custo_brl, log_jsonb)
- [x] `dry_run=True` faz tudo exceto os 2 últimos passos (não escreve em `termos` nem `metricas_coleta`)
- [ ] Teste de integração com Supabase de dev: rodar com seed conhecido cria N termos; rodar de novo cria 0 (idempotência) — validar manualmente com `.env`

## Notas para o agente
- Path: `research/src/ideiapages_research/behaviors/collect_autocomplete/collector.py` (criar pasta + arquivo)
- Lista de stopwords: criar `references/stopwords-pt-br.txt` se ainda não existir (lista pequena ~100 termos pt-BR + termos de baixa intenção tipo "o que", "como")
- Salvar JSON cru da resposta da API em `research/data/raw/autocomplete/<seed_slug>-<timestamp>.json` (gitignored) para debug futuro
- Limite de 500 termos por seed (proteção contra resposta anômala)
- Latência target: ≤ 30s por seed

## Não fazer aqui
- CLI command — issue 03
- Coleta em lote (multi-seed) — issue 03
- Análise de qualidade dos termos — vira responsabilidade do `classify-terms`
