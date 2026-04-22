---
issue: 02-types-and-classifier
behavior: research/classify-terms
fase: fase-0-research-pipeline
status: pending
depends_on: [research/classify-terms/01-prompt-template]
---

# Issue 02 — Tipos Pydantic + classifier (Claude Haiku)

## Objetivo
Implementar a lógica do classifier: ler termos pendentes, chamar Claude Haiku com o prompt versionado, validar JSON retornado, persistir classificações + log de chamada LLM.

## Critérios de aceitação
- [ ] Pydantic models criados/estendidos em `research/src/ideiapages_research/types/term.py`: `TermClassification` (com todos os campos do JSON do prompt), `ClassifyBatchInput`, `ClassifyBatchResult`
- [ ] Wrapper Claude já existe em `research/src/ideiapages_research/llm/claude.py` — estender se necessário com método `call_with_template(template_path, variables, model, temperature, max_tokens) -> ClaudeResponse`
- [ ] Função `classify_batch(termos: list[Termo], prompt_version: int = None, dry_run: bool) -> ClassifyBatchResult` implementada
- [ ] Carrega template de `references/prompts/classify-terms.md` (ou versão específica via arg)
- [ ] Carrega `references/product_facts.md` e injeta como `{{product_facts}}`
- [ ] Monta payload com até 50 termos, chama Claude com `temperature=0.2`
- [ ] Validação rigorosa do JSON retornado: schema correto, enums válidos, score 1-10, sem campos extras
- [ ] Item inválido marcado em `termos.metadata` como `falha_classificacao=true` com motivo, status permanece `coletado`
- [ ] Item válido: update em `termos` com intencao, score_conversao, tipo_pagina_recomendado, cluster, justificativa, status='analisado'
- [ ] Toda chamada Claude registrada em `llm_calls_log` (behavior, prompt_version, model, tokens, custo_brl, latencia_ms)
- [ ] `dry_run`: faz a chamada, valida o JSON, mas não persiste em `termos`
- [ ] Anti-alucinação: validador checa se `justificativa` menciona termos proibidos (ex: preços/planos não em product_facts.md) — se sim, marca como suspeito

## Notas para o agente
- Path do classifier: `research/src/ideiapages_research/behaviors/classify_terms/classifier.py` (criar)
- Modelo: usar `claude-haiku-4-5` ou versão atual mais recente — consultar `anthropic` SDK
- Custo Haiku: aproximadamente R$ 0,01-0,02 por 50 termos. Validar em runtime.
- Latência target: ≤ 60s para batch de 50

## Não fazer aqui
- CLI command — issue 03
- Re-classificação por mudança de prompt — issue 03 ou behavior futuro
- Auditoria por LLM secundário — fora do MVP
