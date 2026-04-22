---
behavior: research/collect-serp
status: draft
created: 2026-04-16
owner: junior
---

# Spec — Collect SERP Snapshot

## Objetivo

Capturar um **snapshot do top N (default 10) resultados orgânicos** do Google para um termo específico em um momento específico, registrando posição, URL, título e meta-descrição. Esse snapshot é a fonte de verdade para análise competitiva, raspagem de conteúdo concorrente e detecção futura de mudanças de ranking (autocura).

## Contexto

Para criar conteúdo que ranqueia, precisamos saber o que **está** ranqueando hoje. Sem snapshot SERP, não temos:
- Lista de URLs concorrentes para raspar (input para `scrape-competitors`)
- Baseline para detectar variações futuras de ranking (input para `monitoring/detect-ranking-drop`)
- Sinal de dificuldade (concorrência) por termo

Diferente de uma SERP API "ao vivo", aqui registramos o estado em uma data específica como evidência histórica.

## Triggers

1. **Operador roda comando manual** para um termo específico, identificado por seu UUID na tabela `termos`
2. **Sistema executa em lote** para todos os termos com `status = 'priorizado'` que ainda não têm snapshot recente (< 30 dias)
3. **Sistema reage ao downstream** — quando `scrape-competitors` é solicitado para um termo sem snapshot, ele dispara este behavior primeiro
4. **Scheduled run mensal** (futuro) para refresh dos snapshots dos termos ativos

## Comportamentos esperados

### Trigger 1: Snapshot manual para um termo

1. Operador fornece UUID do termo
2. Sistema valida que o termo existe e está em status `coletado`, `analisado` ou `priorizado` (não `descartado`)
3. Sistema verifica se há snapshot < 30 dias para esse termo — se sim, pergunta se pular ou forçar
4. Sistema dispara busca Google para o `keyword` do termo, em pt-BR e geo BR, capturando os top 10 resultados orgânicos
5. Sistema descarta resultados que sejam: anúncios pagos, painéis/featured snippets vazios, resultados sem URL (entender futuramente), domínios em lista de exclusão (próprio domínio do cliente, redes sociais como Instagram/Facebook quando irrelevantes)
6. Para cada resultado válido, registra: posição (1-10), URL absoluta, título, meta-descrição, data da coleta
7. Sistema retorna resumo: total de resultados capturados, top 3 domínios, custo

### Trigger 2: Lote de termos priorizados

1. Sistema busca termos com `status = 'priorizado'` sem snapshot recente
2. Para cada termo, executa Trigger 1 com pausa configurável entre chamadas
3. Gera relatório consolidado ao final

### Trigger 3: Cascade do scrape-competitors

1. Outro behavior pede SERP de um termo
2. Sistema verifica cache (< 30 dias) e retorna se houver
3. Caso contrário, executa Trigger 1 silenciosamente e devolve o resultado

### Modo dry-run

Em qualquer trigger, com `dry_run`: faz a chamada externa, **não persiste**, imprime o que seria salvo.

## Estados

- **Idle** — aguardando trigger
- **Querying** — chamada externa em andamento
- **Filtering** — descartando ads, snippets, exclusion list
- **Persisting** — salvando snapshot
- **Failed** — falha externa registrada, termo continua sem snapshot novo

## Entradas / Saídas

**Entradas**:
- UUID do termo (Trigger 1) ou nada (Trigger 2 lote)
- Top N (int, 1-50, default 10)
- Geo (string, default `BR`)
- Idioma (string, default `pt-BR`)
- Lista de domínios a excluir (configurável em `references/serp_exclusion_domains.txt`)
- `dry_run`, `force` (booleans)

**Saídas**:
- Registros na tabela `serp_snapshots` (uma linha por posição capturada, vinculada ao `termo_id` e à data)
- Resumo no console (top domínios, custo)
- Log JSON estruturado

## Dependências

- Tabela `termos` (lê)
- Tabela `serp_snapshots` (escreve)
- Provedor externo de SERP (decisão em aberto — ver Riscos)
- Lista de domínios de exclusão (arquivo estático)

## Regras de negócio

1. **Snapshot é imutável** — uma vez capturado, não é alterado. Nova coleta gera novo snapshot com data nova.
2. **Sem deduplicação cross-data** — dois snapshots do mesmo termo em datas diferentes coexistem (esse é o ponto: histórico).
3. **Domínio próprio sempre excluído** — `ideiamultichat.com.br` e variações nunca contam como concorrente para análise.
4. **Posições são as do RESULTADO ORGÂNICO**, não a posição visual com ads. Posição 1 = primeiro link orgânico após qualquer ad.
5. **Limite de 50 snapshots por execução em lote** para controlar custo. Se houver mais termos pendentes, paginar em execuções.
6. **Idempotência por janela de 30 dias** — se já existe snapshot < 30 dias, novo só com `--force`.

## Critérios de aceitação

- [ ] Para um termo conhecido com UUID, o sistema captura 10 resultados orgânicos válidos
- [ ] Cada resultado tem posição (1-10), URL, título, meta-descrição, data de coleta
- [ ] Anúncios pagos e featured snippets sem URL são descartados (não entram como posição 1)
- [ ] Domínio do cliente nunca aparece nos resultados salvos
- [ ] Rodar duas vezes em < 30 dias sem `--force` não cria snapshot novo
- [ ] Modo `--force` cria snapshot novo mesmo com cache válido
- [ ] Lote para 20 termos priorizados completa em < 10 minutos
- [ ] Modo `--dry-run` não escreve no banco
- [ ] Custo por snapshot exibido e dentro do orçamento (≤ R$ 0,40)
- [ ] Falha de um snapshot no lote não derruba os demais

## Não-objetivos (out of scope)

- Capturar features além dos top 10 orgânicos (PAA, mapas, vídeos, knowledge panel)
- Capturar resultados de busca móvel separados de desktop (futuro)
- Análise semântica do conteúdo das URLs (será feito em `analyze-gaps`)
- Raspagem do conteúdo das URLs (será feito em `scrape-competitors`)
- Tracking contínuo de ranking diário (será feito em `monitoring/detect-ranking-drop` na Fase 4)
- SERP de outros buscadores (Bing, Yandex)

## Métricas de sucesso

| Métrica | Alvo |
|---------|------|
| Resultados orgânicos válidos por snapshot | ≥ 8 (de 10 alvo) |
| Tempo médio por snapshot | ≤ 15s |
| Custo por snapshot | ≤ R$ 0,40 |
| Snapshots completos em lote de 20 | ≥ 18 (90% sucesso) |
| Domínios distintos no top 10 (sanidade) | ≥ 5 |

## Riscos / decisões em aberto

1. **Provedor de SERP**: opções:
   - **Apify actor "Google Search Results"** (popular, ~$0.30 por search, retorna ads + orgânicos + PAA + features)
   - **SerpAPI** (preciso, ~$0.05 por search, mas custo cresce em escala)
   - **Firecrawl `/search`** (cobre o caso, custo fixo por crédito)
   
   **Decisão recomendada**: começar com **Apify actor** (já vamos ter conta) para reuso com `collect-autocomplete` (PAA também sai daí). Reavaliar custo após primeiros 50 snapshots.

2. **Geolocalização**: BR macro vs BR estado/cidade. MVP usa BR puro. Casos regionais (ex: "contador em São Paulo") podem precisar de geo refinado — decidir caso a caso no `/break`.

3. **Captura de features extras (PAA, "pessoas também perguntam", boxes)**: tentador capturar, mas inflaciona escopo deste behavior. PAA já entra via `collect-autocomplete`. Featured snippet pode ser útil para `analyze-gaps` — anotar para futuro.

4. **Detecção de ads vs orgânico**: depende do parser do provedor. Apify actor já separa, mas validar amostra inicial.

5. **Mobile vs Desktop**: Google entrega resultados ligeiramente diferentes. MVP captura desktop (mais simples). Quando autocura olhar ranking, idealmente captura mobile (70% do tráfego). Anotar para Fase 4.

6. **Raw response storage**: salvar JSON cru da resposta em `data/raw/` ajuda reanálise sem refazer chamada. Custa armazenamento mas é barato. Decisão para `/plan`.
