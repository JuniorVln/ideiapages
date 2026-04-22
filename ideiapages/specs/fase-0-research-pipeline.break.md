# Break — Fase 0: Research Pipeline

> Decomposição da spec em 25 issues sequenciais distribuídas pelos 7 behaviors do domínio `research`.
> Spec original: [`specs/fase-0-research-pipeline.md`](./fase-0-research-pipeline.md)

---

## DAG de execução

| #  | Issue | Behavior | depends_on | est. min |
|----|-------|----------|------------|----------|
| 1  | data-model/01-termos-table | research/data-model | [] | 30 |
| 2  | data-model/02-snapshots-and-content | research/data-model | [data-model/01] | 40 |
| 3  | data-model/03-briefings | research/data-model | [data-model/02] | 25 |
| 4  | data-model/04-logs-and-metrics | research/data-model | [data-model/03] | 30 |
| 5  | data-model/05-shared-triggers-rls-types | research/data-model | [data-model/04] | 30 |
| 6  | collect-autocomplete/01-types-and-client | research/collect-autocomplete | [data-model/05] | 60 |
| 7  | collect-autocomplete/02-collector-logic | research/collect-autocomplete | [collect-autocomplete/01] | 90 |
| 8  | collect-autocomplete/03-cli-command | research/collect-autocomplete | [collect-autocomplete/02] | 45 |
| 9  | collect-trends/01-types-and-client | research/collect-trends | [data-model/05] | 60 |
| 10 | collect-trends/02-trends-analyzer | research/collect-trends | [collect-trends/01] | 75 |
| 11 | collect-trends/03-cli-command | research/collect-trends | [collect-trends/02] | 45 |
| 12 | classify-terms/01-prompt-template | research/classify-terms | [data-model/05] | 60 |
| 13 | classify-terms/02-types-and-classifier | research/classify-terms | [classify-terms/01] | 90 |
| 14 | classify-terms/03-cli-command | research/classify-terms | [classify-terms/02] | 45 |
| 15 | collect-serp/01-types-and-client | research/collect-serp | [data-model/05] | 60 |
| 16 | collect-serp/02-collector-logic | research/collect-serp | [collect-serp/01] | 90 |
| 17 | collect-serp/03-cli-command | research/collect-serp | [collect-serp/02] | 45 |
| 18 | scrape-competitors/01-types-and-client | research/scrape-competitors | [collect-serp/03] | 60 |
| 19 | scrape-competitors/02-content-extractor | research/scrape-competitors | [scrape-competitors/01] | 75 |
| 20 | scrape-competitors/03-scraper-logic | research/scrape-competitors | [scrape-competitors/02] | 90 |
| 21 | scrape-competitors/04-cli-command | research/scrape-competitors | [scrape-competitors/03] | 45 |
| 22 | analyze-gaps/01-prompt-template | research/analyze-gaps | [scrape-competitors/04, classify-terms/03] | 75 |
| 23 | analyze-gaps/02-types-and-summarizer | research/analyze-gaps | [analyze-gaps/01] | 90 |
| 24 | analyze-gaps/03-gaps-analyzer | research/analyze-gaps | [analyze-gaps/02] | 90 |
| 25 | analyze-gaps/04-cli-command | research/analyze-gaps | [analyze-gaps/03] | 45 |

---

## Caminho crítico

A sequência abaixo é o lead time mínimo da fase (não pode ser paralelizada):

```
data-model/01 → 02 → 03 → 04 → 05
  → collect-serp/01 → 02 → 03
  → scrape-competitors/01 → 02 → 03 → 04
  → analyze-gaps/01 → 02 → 03 → 04
```

**Tempo estimado do caminho crítico**: ~13.5 horas de trabalho do agente.

---

## Issues paralelizáveis

Após `data-model/05` concluir, **3 trilhas** podem rodar em paralelo:

- **Trilha A**: `collect-autocomplete/01 → 02 → 03` (~3.5h)
- **Trilha B**: `collect-trends/01 → 02 → 03` (~3h)
- **Trilha C**: `classify-terms/01 → 02 → 03` (~3.25h)
- **Trilha D**: `collect-serp/01 → 02 → 03` (~3.25h) — esta destrava `scrape-competitors`

Trilhas A, B, C podem rodar 100% em paralelo. Trilha D precisa concluir antes de `scrape-competitors`.

`analyze-gaps/01` precisa de `scrape-competitors/04` E `classify-terms/03`.

---

## Estimativa total

- **Sequencial puro**: ~25 horas de trabalho
- **Com paralelismo máximo (4 trilhas)**: ~13.5 horas (caminho crítico)
- **Realista para 1 dev humano operando os agentes**: 2-3 dias úteis se rodar concentrado, 1 semana se rodar 2-3h/dia

---

## Marcos intermediários da fase

- **M0** — após `data-model/05`: schema completo no Supabase, tipos TS regenerados (smoke test possível)
- **M1** — após `collect-autocomplete/03` + `collect-trends/03`: pipeline de descoberta funcional
- **M2** — após `classify-terms/03`: termos classificados e prontos para priorização manual
- **M3** — após `collect-serp/03`: snapshots SERP capturados
- **M4** — após `scrape-competitors/04`: corpus de concorrentes completo
- **M5** — após `analyze-gaps/04`: briefings prontos. **Fase pronta para revisão do Júnior**
