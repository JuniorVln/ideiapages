---
issue: 01-types-and-client
behavior: research/collect-trends
fase: fase-0-research-pipeline
status: done
depends_on: [research/data-model/05-shared-triggers-rls-types]
---

# Issue 01 — Tipos Pydantic + wrapper pytrends

## Objetivo
Definir tipos Pydantic dos dados de tendência e implementar wrapper resiliente do `pytrends` com retry/backoff anti-ban.

## Critérios de aceitação
- [x] Pydantic models criados: `TrendDataPoint`, `RelatedQuery`, `TrendsCollectInput`, `TrendsCollectResult`
- [x] Wrapper `PyTrendsClient` implementado com método `fetch(keyword, geo='BR', timeframe='today 12-m', cat=0) -> TrendsCollectResult | None` (None se sem dados)
- [x] Retry exponencial em HTTP 429/5xx (até 3 tentativas, backoff 5s/15s/45s)
- [x] Detecção de ban persistente: após 3 falhas consecutivas, levantar exceção `PyTrendsBannedError`
- [x] Pausa interna mínima de 2s entre chamadas no mesmo client (configurável)
- [x] Configuração `hl='pt-BR'`, `tz=180` (Brasília)
- [ ] Teste com keyword conhecida ("atendimento whatsapp"): retorna ≥ 50 pontos de série e ≥ 1 related query — validar manualmente com `.env` e rede

## Notas para o agente
- Path do client: `research/src/ideiapages_research/clients/pytrends_client.py` (já existe placeholder — extender)
- Path dos tipos: `research/src/ideiapages_research/types/trends.py` (criar)
- pytrends é não-oficial e frágil: encapsular bem para futuro fallback (Apify Google Trends actor)
- Documentar no docstring do client: link da lib, versão suportada, comportamento em caso de "no data"
- Custo: R$ 0,00 sempre (registrar 0 no `metricas_coleta`)

## Não fazer aqui
- Análise da série (tendência crescente/decrescente, sazonalidade) — issue 02
- Persistência em `termos.tendencia_pytrends` — issue 02
- CLI command — issue 03
