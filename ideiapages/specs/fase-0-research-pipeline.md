---

## fase: fase-0-research-pipeline

status: draft
created: 2026-04-16
owner: junior

# Spec — Fase 0: Research Pipeline

## Objetivo

Descobrir, classificar e priorizar **20 a 50 termos de busca** do nicho Ideia Chat com **briefings SEO completos** (gaps de Information Gain identificados), prontos para virarem páginas na Fase 1. Sem esse alicerce, qualquer página gerada é chute.

## Contexto

A pesquisa de termos é o gargalo de qualidade do projeto inteiro. Um termo errado → página que ninguém procura ou impossível de ranquear. Esta fase é **100% backend** (Python + Supabase, sem UI ainda) e **100% offline em relação ao usuário final** — toda a coleta acontece em batch, e o output é uma fila de termos priorizados com briefing pronto.

## Escopo da fase (behaviors envolvidos)

Esta fase materializa 7 behaviors do domínio `research`:

1. `data-model` — schema Supabase (tabelas + RLS)
2. `collect-autocomplete` — autocomplete + PAA do Google
3. `collect-serp` — snapshot SERP top 10
4. `scrape-competitors` — markdown limpo dos concorrentes (Firecrawl)
5. `collect-trends` — tendência Google Trends (pytrends)
6. `classify-terms` — Claude classifica intent + score
7. `analyze-gaps` — Claude gera briefing de Information Gain

Cada behavior tem `contract.md` próprio em `behaviors/research/<behavior>/contract.md` descrevendo seus detalhes operacionais.

## Triggers

1. **Operador (Júnior) executa o pipeline** via CLI passando o seed file (`seeds/ideia_chat.json`)
2. **Operador roda behavior individual** para depurar ou refinar (ex: só `collect-autocomplete` para um seed novo)
3. **Operador audita resultados intermediários** no Supabase e aprova/rejeita termos para avançar de fase

## Comportamentos esperados (alto nível)

### Fluxo principal end-to-end

1. Schema Supabase está aplicado (tabelas `termos`, `serp_snapshots`, `conteudo_concorrente`, `briefings_seo`, `classificacoes_log`, `metricas_coleta`)
2. CLI `ideiapages-research collect-autocomplete --seed-file seeds/ideia_chat.json` popula `termos` com 100-300 termos crus
3. CLI `ideiapages-research classify-terms --batch-size 50` avança termos de `coletado` → `analisado`, atribuindo `intencao`, `score_conversao`, `tipo_pagina_recomendado`, `cluster`
4. CLI `ideiapages-research collect-trends` enriquece termos com sinal de tendência (crescente/estável/decrescente)
5. Operador audita e marca termos com `score_conversao >= 7` e tendência não-decrescente como `priorizado` (manual ou via comando filtrador)
6. CLI `ideiapages-research collect-serp` captura snapshot top 10 dos termos priorizados
7. CLI `ideiapages-research scrape-competitors` raspa markdown limpo das URLs concorrentes
8. CLI `ideiapages-research analyze-gaps` gera `briefing_seo` por termo com Claude → status vira `briefing_pronto`
9. CLI `ideiapages-research report` gera relatório final em markdown legível

### Modo de operação esperado

- Toda execução é **idempotente** (rodar 2x não duplica)
- Toda execução tem **modo `--dry-run`** que não persiste
- Toda execução respeita **rate limits** das APIs externas
- Custo total acumulado é **rastreável** por behavior (tabela `metricas_coleta`)

## Entradas

- `seeds/ideia_chat.json` — lista de 5-15 keywords semente do nicho
- Credenciais válidas em `.env`: Supabase service_role, Apify token, Firecrawl key, Anthropic key
- Knowledge base em `references/product_facts.md` (descreve Ideia Chat para o LLM classificador)

## Saídas

- **20-50 termos com `status = 'briefing_pronto'`** no Supabase
- **Briefings SEO** persistidos em `briefings_seo` (jsonb com tópicos, gaps, formato sugerido, word count alvo, headings, dados Ideia Chat)
- **Relatório final em markdown** salvo em `research/data/relatorios/fase-0-<timestamp>.md` com:
  - Total de termos coletados, classificados, priorizados, com briefing
  - Distribuição de intent e score
  - Top 10 termos por score
  - Custo total da fase (R$)
  - Lista de decisões em aberto para Fase 1

## Critérios de "feito" (verificáveis no fim)

- Migrations 0001-0005 aplicadas no Supabase (smoke test: insert/select/update OK em cada tabela)
- Tipos TypeScript regenerados em `web/src/lib/database.types.ts`
- CLI `ideiapages-research --help` lista todos os comandos disponíveis
- Pipeline rodado de ponta a ponta com `seeds/ideia_chat.json` sem intervenção manual além das auditorias previstas
- ≥ 20 termos com `status = 'briefing_pronto'` ao fim
- Cada briefing tem: tópicos commodity, gaps puros, formato sugerido, word count alvo, headings, dados Ideia Chat
- Relatório final gerado e revisado por Júnior
- Custo total da fase ≤ R$ 200
- Tempo total da execução do pipeline ≤ 4 horas (incluindo waits de rate limit)
- Nenhum behavior deixou dado órfão (FKs íntegras)
- Documentação de "como rodar" atualizada em `research/README.md`

## Não-objetivos (out of scope desta fase)

- Geração de páginas em si (Fase 2)
- Renderização Next.js (Fase 1)
- Captura de leads (Fase 1)
- A/B testing entre variações de página (Fase 2)
- Dashboard de performance (Fase 3)
- Autocura / detecção de drop de ranking (Fase 4)
- Integração com Google Search Console (Fase 1)
- Refresh automático periódico dos snapshots e briefings (futuro)
- UI web para audit dos termos (audit é via Supabase Studio nesta fase)
- Multilíngue (apenas pt-BR)
- Termos de nichos diferentes do Ideia Chat (1 nicho por vez)

## Métricas de sucesso


| Métrica                                                   | Alvo     |
| --------------------------------------------------------- | -------- |
| Termos com briefing pronto                                | 20-50    |
| Distribuição de intent (não 100% num bucket)              | sim      |
| Custo total da fase                                       | ≤ R$ 200 |
| Tempo total do pipeline                                   | ≤ 4 h    |
| Taxa de briefings auditados como "acionáveis" pelo Júnior | ≥ 70%    |
| Erros que pararam o pipeline                              | 0        |


## Riscos / decisões em aberto

1. **Provedor exato dos actors Apify** (autocomplete, PAA, SERP) — definir no `/break` ao planejar `collect-autocomplete` e `collect-serp`
2. **Modelo Claude para classify vs analyze-gaps** — começar com Haiku para classify, Sonnet para gaps; reavaliar após primeira execução real
3. **Estratégia de compressão de concorrentes para o `analyze-gaps`** caber no contexto do LLM — extrativo (default) vs abstrativo (Haiku reduzindo cada concorrente antes de mandar pro Sonnet)
4. **Auditoria humana entre `classify-terms` e `priorizado`** — automática (filtro por score) ou manual (Júnior aprova um a um)? Recomendado: filtro automático + revisão por amostragem
5. **Ban de pytrends** — pytrends não é oficial; se for banido, plano B é Apify Google Trends actor (custa créditos)
6. **Privacidade do seed file** — seeds podem revelar estratégia comercial; nunca logar conteúdo completo em produção
7. **Onde rodar o pipeline** — máquina local do Júnior (MVP), Cloud Run/cron job (futuro)

## Próximo passo após `/spec`

Rodar `/break fase-0-research-pipeline` para gerar a sequência de issues (uma por behavior, na ordem de dependência: `data-model` primeiro, depois collectors em paralelo, depois `classify-terms`, depois `collect-serp` → `scrape-competitors` → `analyze-gaps`).