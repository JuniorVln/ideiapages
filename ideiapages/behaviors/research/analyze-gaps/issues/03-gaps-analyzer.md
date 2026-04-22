---

## issue: 03-gaps-analyzer
behavior: research/analyze-gaps
fase: fase-0-research-pipeline
status: pending
depends_on: [research/analyze-gaps/02-types-and-summarizer]

# Issue 03 — Analyzer: monta payload, chama Claude Sonnet, valida e persiste

## Objetivo

Implementar a função central que para cada termo: monta payload com summaries + product_facts + classificação, chama Claude Sonnet, valida o BriefingSEO retornado, persiste em `briefings_seo` e atualiza `termos.status='briefing_pronto'`.

## Critérios de aceitação

- Função `analyze_gaps_for_term(termo: Termo, prompt_version: int = None, top_n: int = 10, dry_run: bool, force: bool) -> AnalyzeGapsReport`
- Carrega prompt template (versão dada ou última)
- Chama `summarize_competitors_for_term(termo.id, top_n)`
- Carrega `references/product_facts.md`
- Monta payload, chama Claude Sonnet com `temperature=0.3`, `max_tokens=8000`
- Validação rigorosa via Pydantic `BriefingSEO`; falha de validação → não persiste, registra erro detalhado em `metricas_coleta.log_jsonb`
- Anti-alucinação: validador adicional checa se títulos/CTAs mencionam termos proibidos (preços/features fora de product_facts) → marca `alertas_para_humano` ou descarta dependendo da severidade
- Persiste em `briefings_seo` (briefing_jsonb com `version: 1`, model, prompt_version, custo_brl)
- Atualiza `termos.status='briefing_pronto'`
- Cache: se já existe briefing para o termo com mesma `prompt_version` e `force=False`, é skip
- Toda chamada Claude registrada em `llm_calls_log`
- `dry_run`: faz tudo até validação, retorna o briefing mas não persiste

## Notas para o agente

- Path: `research/src/ideiapages_research/behaviors/analyze_gaps/analyzer.py`
- Custo target: ≤ R$ 1,00 por briefing (Sonnet com prompt + summaries comprimidos deve ficar entre R$ 0,30-0,80)
- Latência target: ≤ 90s por termo
- Em caso de Claude retornar JSON inválido, retentar 1x com mensagem "seu output anterior não foi JSON válido — devolva apenas JSON conforme schema"

## Não fazer aqui

- CLI command — issue 04
- Re-geração automática de briefings desatualizados — Fase 4
- A/B de prompts — Fase 2