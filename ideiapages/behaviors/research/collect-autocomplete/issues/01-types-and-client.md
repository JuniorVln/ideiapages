---
issue: 01-types-and-client
behavior: research/collect-autocomplete
fase: fase-0-research-pipeline
status: done
depends_on: [research/data-model/05-shared-triggers-rls-types]
---

# Issue 01 — Tipos Pydantic + wrapper Apify para autocomplete/PAA

## Objetivo
Definir os tipos Pydantic dos resultados de autocomplete e PAA, e implementar o wrapper de cliente Apify específico para esses dois actors.

## Critérios de aceitação
- [x] Pydantic models criados: `AutocompleteSuggestion`, `PAAQuestion`, `AutocompleteCollectInput`, `AutocompleteCollectResult`
- [x] Wrapper `ApifyAutocompleteClient` implementado com método `collect(seed: str, geo: str, lang: str, limit: int) -> list[AutocompleteSuggestion]`
- [x] Wrapper `ApifyPAAClient` implementado com método `collect(seed: str, geo: str, lang: str, limit: int) -> list[PAAQuestion]`
- [x] Ambos suportam timeout configurável e retry exponencial em 429/5xx
- [x] Custo estimado por chamada exposto via `last_call_cost_brl`
- [x] Teste unitário básico com Apify SDK em modo mock (sem chamar API real)

## Notas para o agente
- Decidir o actor exato no início (anotar no `__init__` do client com link Apify): para autocomplete, considerar `apify/google-search-scraper` ou actor específico de autocomplete; para PAA, geralmente sai do mesmo actor de SERP
- Se decidir usar UM actor compartilhado (search-scraper retorna autocomplete + PAA + SERP), documentar e expor dois métodos no mesmo client em vez de criar um novo
- Custo estimado: usar `dataset_item_count * preco_por_run` documentado no Apify
- Path no Python: `research/src/ideiapages_research/clients/apify.py` (já existe placeholder — extender)
- Tipos Pydantic: `research/src/ideiapages_research/types/autocomplete.py` (criar)

## Não fazer aqui
- Lógica de dedup, normalização ou persist — issue 02
- CLI command — issue 03
- Cliente Apify para SERP (será compartilhado mas implementado em `collect-serp/01`)
