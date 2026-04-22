---

## behavior: research/scrape-competitors
status: draft
created: 2026-04-16
owner: junior

# Spec — Scrape Competitors

## Objetivo

Para cada termo com snapshot SERP coletado, **raspar o conteúdo textual completo** das URLs concorrentes do top 10, normalizá-lo em markdown, extrair estrutura (headings, contagem de palavras, FAQ presente) e persistir como insumo para análise de gaps de Information Gain.

## Contexto

Conteúdo só ranqueia se for **melhor** que o que já está lá. Sem ler o que os concorrentes cobrem, escrevemos no escuro. Esse behavior transforma URLs em corpus analisável, com qualidade limpa (sem nav, footer, ads, popups) e estrutura preservada (h1, h2, h3, listas). É a base para `analyze-gaps` decidir o que falta cobrir.

## Triggers

1. **Operador roda comando manual** para um termo específico (UUID), raspando todas as URLs do snapshot mais recente
2. **Sistema executa em lote** para termos com snapshot recente sem raspagem ainda
3. **Cascade automático** quando `analyze-gaps` precisa de conteúdo e ele não existe
4. **Scheduled refresh** (futuro) — re-raspar páginas top trimestralmente para detectar mudanças de conteúdo

## Comportamentos esperados

### Trigger 1: Raspagem manual para um termo

1. Operador fornece UUID do termo
2. Sistema busca o snapshot SERP mais recente desse termo
3. Se não houver snapshot, sistema **dispara `collect-serp` automaticamente** (ou avisa e para, conforme decisão em `/plan`)
4. Para cada URL do snapshot (até top N, default 10), em paralelo limitado (concorrência 3):
  - Sistema verifica se já existe conteúdo raspado < 30 dias para essa URL — se sim, pula
  - Sistema dispara raspagem com Firecrawl (ou equivalente), pedindo markdown limpo
  - Sistema valida que retornou conteúdo mínimo (≥ 200 palavras de corpo) — se menos, marca como "thin/falhou"
  - Sistema extrai metadados estruturais do markdown: H1, todas as H2 e H3, contagem de palavras, presença de FAQ, presença de tabela, presença de imagens
  - Sistema persiste `conteudo_concorrente` vinculando ao snapshot
5. Sistema retorna resumo: URLs raspadas, falhas, custo, tempo médio por página

### Trigger 2: Lote de termos pendentes

1. Sistema busca termos priorizados com snapshot < 30 dias e sem raspagem completa
2. Para cada, executa Trigger 1 com pausa entre termos
3. Reporta consolidado

### Trigger 3: Cascade do analyze-gaps

1. Outro behavior precisa do conteúdo raspado de um termo
2. Sistema verifica se já existe corpus completo
3. Se sim, retorna; se não, executa Trigger 1 silenciosamente

### Modo dry-run

Faz raspagem mas não persiste no banco. Útil para inspecionar visualmente uma página antes de gravar.

## Estados

- **Idle**
- **Resolving** — buscando snapshot, decidindo URLs
- **Scraping** — chamadas Firecrawl em paralelo
- **Parsing** — extraindo headings, contagens
- **Persisting** — salvando no banco
- **Partial** — algumas URLs falharam, outras OK
- **Failed** — todas as URLs falharam

## Entradas / Saídas

**Entradas**:

- UUID do termo (Trigger 1)
- Top N URLs a raspar (int, 1-10, default 10)
- Concorrência (int, default 3)
- Cache em dias (int, default 30)
- `dry_run`, `force` (booleans)

**Saídas**:

- Registros em `conteudo_concorrente` com markdown completo e metadados
- Resumo: URLs raspadas com sucesso, falhas, custo total, tempo
- Log JSON estruturado
- (opcional) markdown crú salvo em `data/raw/scrape/<snapshot_id>/<url_hash>.md` para inspeção manual

## Dependências

- Tabela `serp_snapshots` (lê)
- Tabela `conteudo_concorrente` (escreve)
- Cliente Firecrawl (ou equivalente — ver Riscos)
- Cascade opcional para `collect-serp` (se snapshot ausente)

## Regras de negócio

1. **Idempotência por URL + janela de 30 dias** — não re-raspa se conteúdo é recente, salvo `--force`
2. **Limpeza obrigatória** — markdown salvo já vem sem nav, footer, popup, comments, ads, sidebars (Firecrawl faz isso)
3. **Truncamento de conteúdo absurdo** — markdown > 100k chars é truncado em 100k (proteção contra páginas anômalas), com flag `truncated = true`
4. **Idiomas** — conteúdo em português (pt-BR ou pt-PT) tem prioridade. Páginas em outras línguas são salvas mas marcadas com `idioma_detectado`
5. **Respeito a robots.txt** — Firecrawl já respeita, validar comportamento
6. **Sem credenciais ou cookies** — não tentar burlar paywalls. Páginas com paywall são marcadas `paywalled = true` e o pouco conteúdo público é salvo
7. **Concorrência limitada** — máximo 3 raspagens em paralelo por execução para não estourar rate limit do Firecrawl
8. **Tempo máximo por URL** — 60s. Após isso, marca falha e segue
9. **Sanitização** — remover caracteres de controle, normalizar quebras de linha, mas preservar markdown de listas/tabelas

## Critérios de aceitação

- Para um termo com snapshot, o sistema raspa as 10 URLs e persiste 8+ com sucesso (≥ 80%)
- Cada registro tem: URL, markdown limpo, word_count, lista de H2 e H3, presença de FAQ/tabela/imagens, idioma detectado
- Markdown salvo não contém HTML cru, nav, footer ou conteúdo claramente irrelevante
- Páginas com < 200 palavras de corpo são marcadas como `thin = true` e não bloqueiam o lote
- Re-rodar em < 30 dias sem `--force` pula tudo (cache hit)
- `--force` força re-raspagem
- Cascade automático para `collect-serp` funciona (se habilitado)
- Concorrência respeitada (no máx 3 raspagens paralelas)
- Custo por URL ≤ R$ 0,15
- Lote de 5 termos (50 URLs) completa em < 25 minutos
- Páginas com paywall sinalizadas, não falham o lote
- Modo `--dry-run` não persiste

## Não-objetivos (out of scope)

- Análise semântica do conteúdo (será feito em `analyze-gaps`)
- Comparação cross-page de gaps (será feito em `analyze-gaps`)
- Score de qualidade do concorrente (será feito em `analyze-gaps`)
- Raspagem de mídia (vídeos, imagens) — só metadado de presença
- Renderização de SPAs com interação complexa (Firecrawl resolve a maioria sem precisarmos disso)
- Burla de bloqueio anti-bot agressivo (se uma URL bloqueia, fica como falha registrada — não tentar contornar)

## Métricas de sucesso


| Métrica                                            | Alvo           |
| -------------------------------------------------- | -------------- |
| Taxa de sucesso de raspagem por URL                | ≥ 80%          |
| Tempo médio por URL                                | ≤ 20s          |
| Custo médio por URL                                | ≤ R$ 0,15      |
| URLs com `thin = true` (suspeita de conteúdo ruim) | ≤ 10% do total |
| Word count médio das URLs com sucesso              | ≥ 800          |


## Riscos / decisões em aberto

1. **Provedor de scraping**:
  - **Firecrawl** (escolha default — já alinhado no plano, faz limpeza nativa, retorna markdown)
  - **Apify scraper genérico** (alternativa, custo similar, menos polido)
   **Decisão**: usar Firecrawl. Confirmar plano (Hobby/Pro) no `/plan` para garantir cota suficiente para o piloto.
2. **Cascade automático para `collect-serp`**: liga ou separa?
  - Liga: mais conveniente para o operador ("scrape para esse termo" e pronto)
  - Separa: mais explícito, força operador a verificar SERP antes
   **Decisão recomendada**: cascade habilitado por padrão, mas com flag `--no-cascade` para desligar.
3. **Salvar markdown cru em disco** (`data/raw/scrape/`): útil para debug e reanálise offline. Custo ~zero. Adicionar ao `.gitignore` raiz. Decisão para `/plan`.
4. **Detecção de FAQ structured data**: simples regex em markdown ou parsing de JSON-LD presente? MVP fica com regex (mais barato). JSON-LD parsing pode entrar em iteração 2.
5. **Idioma detectado**: usar lib `langdetect` ou heurística simples (presença de stopwords pt). Decidir no `/plan`.
6. **Páginas SPA (React-only sem SSR)**: Firecrawl renderiza JS por padrão? Validar em URL conhecida de SPA antes de declarar pronto.
7. **Privacidade**: conteúdo raspado pode ter PII (depoimentos, nomes). Avaliar se precisa de mask antes de persistir. MVP não faz mask (conteúdo é público), mas anotar para review jurídico.