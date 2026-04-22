---
issue: 02-trends-analyzer
behavior: research/collect-trends
fase: fase-0-research-pipeline
status: done
depends_on: [research/collect-trends/01-types-and-client]
---

# Issue 02 — Analyzer da série + persistência em `termos.tendencia_pytrends`

## Objetivo
Processar a série temporal retornada pelo client: classificar tendência (crescente/estável/decrescente), detectar mês de pico, extrair top 5 queries relacionadas, e persistir tudo em `termos.tendencia_pytrends`.

## Critérios de aceitação
- [x] Função `analyze_and_persist(termo_id: UUID, result: TrendsCollectResult, dry_run: bool) -> AnalysisReport` implementada (aceita `result is None`)
- [x] Classificação de tendência via regressão linear simples sobre os últimos 12 pontos: slope > +0.5 = `crescente`, < -0.5 = `decrescente`, entre = `estavel` (thresholds configuráveis via env)
- [x] Mês de pico: int 1-12, calculado como mês com média mais alta na série
- [x] Sazonalidade simples: `pico_mes` + `amplitude` (max - min normalizado)
- [x] Top 5 queries em alta (rising) e top 5 mais buscadas (top), com seus valores
- [x] Tudo salvo em `termos.tendencia_pytrends` como JSONB com schema:
  ```json
  {
    "version": 1, "geo": "BR", "timeframe": "today 12-m", "fetched_at": "...",
    "tendencia": "crescente|estavel|decrescente|no_data",
    "slope": 0.85, "pico_mes": 3, "amplitude": 0.45,
    "serie": [{"data": "2025-04", "interesse": 65}, ...],
    "rising_queries": [...], "top_queries": [...]
  }
  ```
- [x] Caso `result is None` (no_data), salvar `{"version": 1, "tendencia": "no_data", "fetched_at": "..."}`
- [x] `dry_run` não persiste, apenas retorna o JSONB calculado
- [x] Cache de 30 dias respeitado (consulta `tendencia_pytrends.fetched_at` antes de re-processar; `force=True` ignora) — no CLI/runner
- [ ] Teste: para uma keyword conhecida, persiste corretamente e segunda execução em < 30 dias é skip — validar manualmente

## Notas para o agente
- Path: `research/src/ideiapages_research/behaviors/collect_trends/analyzer.py` (criar)
- Regressão linear: usar `numpy.polyfit(range(n), valores, deg=1)` ou `scipy.stats.linregress` (preferir numpy para menor dep)
- Heurística de tendência é grosseira mas suficiente para MVP — anotar em comentário a melhoria futura (detrending sazonal)

## Não fazer aqui
- CLI command — issue 03
- Detecção sofisticada de sazonalidade (FFT, decomposição) — fora do MVP
- Análise cross-keyword (clusters em alta) — fora desta fase
