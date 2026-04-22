---

## behavior: research/classify-terms
status: draft
created: 2026-04-16
owner: junior

# Spec — Classify Terms (LLM)

## Objetivo

Para cada termo coletado em estado `coletado`, usar um LLM (Claude) para classificar:

- **Intenção de busca** (informacional, transacional, comparativa, navegacional)
- **Score de conversão** (1-10, fundo-de-funil)
- **Tipo de página recomendado** (landing, blog, comparison, faq, guide)
- **Cluster temático** (agrupamento que o termo pertence)
- **Justificativa** (1 frase para auditoria humana)

E avançar o termo para `status = 'analisado'`.

## Contexto

Sem classificação automática, alguém humano teria que olhar 200+ termos um a um e decidir o que vale criar página. Isso não escala. O LLM faz uma primeira passada que: (a) descarta lixo claro, (b) prioriza fundo-de-funil para virar `priorizado`, (c) sugere o formato de página (landing, blog, comparison) que melhor atende o intent. Humano valida apenas a fronteira (score 6-7) e o topo da lista.

## Triggers

1. **Operador roda comando manual** com `--batch-size N` para classificar próximo lote pendente
2. **Sistema executa em lote** automático para todos os termos pendentes (com `status = 'coletado'`) até esgotar
3. **Re-classificação manual** de termos já classificados, quando o prompt evolui de versão (ex: prompt v2 melhor que v1)

## Comportamentos esperados

### Trigger 1: Classificação em lote

1. Operador especifica `--batch-size` (default 50, máx 200)
2. Sistema busca até N termos com `status = 'coletado'`, ordenados por mais antigo primeiro
3. Sistema lê `references/product_facts.md` e `references/prompts/classify-terms.md` (template versionado)
4. Sistema monta payload do prompt com:
  - System prompt: instruções, schema esperado, anti-alucinação, critérios de score
  - User prompt: produto Ideia Chat (de product_facts), público-alvo, lista de até 50 keywords
5. Sistema chama Claude (modelo recomendado: Haiku para custo, Sonnet para qualidade — decidir no `/plan`)
6. Sistema valida resposta:
  - Deve ser JSON parseável
  - Cada item deve ter campos obrigatórios e tipos corretos
  - `score_conversao` ∈ [1,10], `intencao` em enum válido, `tipo_pagina_recomendado` em enum válido
  - Item ausente ou inválido é registrado como falha individual, não derruba o batch
7. Para cada keyword classificada com sucesso, sistema atualiza o registro em `termos`:
  - `intencao`, `score_conversao`, `tipo_pagina_recomendado`, `cluster`, `status = 'analisado'`
  - Salva `justificativa` em coluna nova ou em `metadata` jsonb
8. Sistema registra custo da chamada (tokens × preço) em log e tabela auxiliar de auditoria
9. Sistema repete até esgotar pendentes ou bater limite de batches por execução (proteção de custo)
10. Sistema retorna resumo: total processado, sucesso, falhas, custo total, distribuição de scores

### Trigger 2: Re-classificação por nova versão de prompt

1. Operador especifica filtro: `--reclassify --prompt-version 2 --where "intencao IS NULL OR cluster = 'desconhecido'"`
2. Sistema processa esses termos forçando re-classificação mesmo já estando `analisado`
3. Mantém histórico (versionamento de classificação no jsonb) — decisão final em `/plan`

### Modo dry-run

Faz a chamada ao LLM, **não persiste**, imprime o JSON parseado e custo estimado. Útil para validar prompt antes de processar 200 termos.

## Estados

- **Idle**
- **Loading** — buscando termos pendentes do banco
- **Calling-LLM** — chamada ativa
- **Validating** — validação do JSON de resposta
- **Persisting**
- **Partial** — alguns itens falharam validação
- **Failed** — chamada LLM falhou (rate limit persistente, autenticação)

## Entradas / Saídas

**Entradas**:

- `--batch-size` (int, default 50, máx 200)
- `--max-batches` (int, default 10, proteção de custo)
- `--prompt-version` (int, default = última versão registrada)
- `--reclassify` (bool, force-update mesmo se já analisado)
- `--where` (filtro SQL adicional, advanced)
- `dry_run` (bool)

**Saídas**:

- Update em `termos`: `intencao`, `score_conversao`, `tipo_pagina_recomendado`, `cluster`, `status`, `justificativa`
- Registro em tabela auxiliar de auditoria (`classificacoes_log`): qual prompt version, tokens, custo, timestamp
- Resumo no console: distribuição de score (histograma), top clusters, custo
- Log JSON estruturado

## Dependências

- Tabela `termos` (lê e atualiza)
- Tabela auxiliar `classificacoes_log` (escreve) — possivelmente criada por `model-writer`
- Cliente Claude (Anthropic SDK)
- Template de prompt em `references/prompts/classify-terms.md` (versionado, criado por `prompt-engineer`)
- Knowledge base em `references/product_facts.md` (lido e injetado no prompt)

## Regras de negócio

1. **Anti-alucinação** — prompt obriga LLM a usar apenas fatos de `product_facts.md`. Se LLM mencionar plano/feature inexistente na justificativa, item é flagged para revisão humana
2. **Versionamento de prompt** — toda classificação registra `prompt_version` usado. Mudança de prompt = nova versão. Re-classificação opt-in.
3. **Custo controlado** — `--max-batches` evita loop infinito acidental. Alerta se custo passar de R$ 50 em uma execução.
4. **Determinismo razoável** — temperature baixa (0.2-0.3) para classificação reproducível
5. **Fallback graceful** — se Claude rate-limita, retry exponencial. Se persistir 5 min, pausar e devolver controle (não congelar terminal)
6. **Validação rigorosa** — JSON inválido, campo faltando ou enum errado marca item como `falha_classificacao = true` e mantém `status = 'coletado'` (humano vê e decide)
7. **Idempotência** — re-rodar sem `--reclassify` ignora termos já classificados (não gasta tokens à toa)
8. **Batch-size respeitando context window** — 50 keywords entram tranquilo no contexto; 200 começa a ficar arriscado dependendo do prompt. Validar empiricamente

## Critérios de aceitação

- Para um lote de 50 keywords coletadas, sistema retorna 50 classificações em < 60 segundos
- Cada termo classificado tem todos os campos preenchidos com valores válidos do enum
- Status do termo avança de `coletado` para `analisado` apenas se classificação válida
- Termo com classificação inválida fica em `coletado` e flagged como `falha_classificacao`
- Distribuição de `score_conversao` exibida (deve haver variedade — não 100% no mesmo score)
- Custo de 50 keywords ≤ R$ 1,00 (Haiku) ou ≤ R$ 5,00 (Sonnet)
- Modo `--dry-run` não persiste
- Re-rodar sem `--reclassify` não re-processa nada (custo zero)
- Re-rodar com `--reclassify` força nova classificação e registra nova `prompt_version`
- Justificativa de cada classificação legível e coerente em amostra de 10
- Anti-alucinação validado: nenhum termo cita preço/plano que não está em `product_facts.md`

## Não-objetivos (out of scope)

- Análise de gaps de Information Gain (será feito em `analyze-gaps`)
- Geração de copy da página em si (será feito em `generation/*`)
- Análise estatística de clusters (k-means etc.) — usamos cluster temático sugerido pelo LLM
- Tradução / localização de termos — mantemos pt-BR
- Sentiment analysis — não relevante para SEO programático
- Detecção automática de ICP novo — humano define ICP, prompt usa

## Métricas de sucesso


| Métrica                                                        | Alvo                                   |
| -------------------------------------------------------------- | -------------------------------------- |
| Taxa de classificação válida (vs falha)                        | ≥ 95%                                  |
| Custo por termo classificado                                   | ≤ R$ 0,02 (Haiku) / ≤ R$ 0,10 (Sonnet) |
| Tempo médio por termo (em batch)                               | ≤ 1.5s                                 |
| Coerência da classificação (auditoria humana de amostra)       | ≥ 85%                                  |
| Distribuição de scores 1-10 (não concentrada num bucket único) | sim                                    |
| Termos `priorizado` após filtragem score ≥ 7                   | 20-50 (alvo do MVP)                    |


## Riscos / decisões em aberto

1. **Modelo Claude: Haiku ou Sonnet?**
  - **Haiku**: ~10x mais barato, classificação de termos é tarefa relativamente simples, deve ser suficiente
  - **Sonnet**: melhor raciocínio, justificativa mais nuançada, melhor anti-alucinação
   **Decisão recomendada**: começar com **Haiku**, validar qualidade em amostra de 30 termos auditados manualmente; se score de coerência < 85%, migrar para Sonnet. Custo de Sonnet ainda é aceitável no volume MVP.
2. **Batch size ótimo**: 50 keywords parece bom balanço (input ~3k tokens, output ~5k tokens). Validar se maior (100+) compromete qualidade ou apenas custo.
3. **Versionamento de classificação**: salvar histórico (jsonb com array `[ {prompt_v: 1, ...}, {prompt_v: 2, ...} ]`) ou só sobrescrever?
  - Histórico ajuda a comparar versões e auditar. Custo de storage zero.
  - **Decisão recomendada**: histórico em jsonb, decidir schema no `/plan`.
4. **Cluster: livre ou fixo?**
  - Livre (LLM inventa nomes): mais flexível, mas pode gerar 30 clusters singletons inúteis
  - Fixo (lista pré-definida): rígido mas garante agrupamento útil para hubs
  - **Decisão recomendada**: livre na primeira passada, depois rodar uma "consolidação de clusters" (outro behavior ou prompt) que mapeia para 5-10 clusters canônicos. Adicionar como issue futura.
5. **Justificativa: salvar ou descartar?**
  - Salvar: ajuda revisão humana, mas inflaciona dados
  - **Decisão recomendada**: salvar em coluna `justificativa` (text). Útil para Fase 1 de aprovação manual com Júnior.
6. **Reclassificação bulk**: como evitar pagar 2x se prompt v2 não muda significativamente para a maioria? Pode comparar saídas e só persistir se mudou. Anotar para iteração 2.
7. **Tabela `classificacoes_log`**: nome ok? Schema: `id, termo_id, prompt_version, model, tokens_input, tokens_output, custo_brl, classificacao_jsonb, created_at`. Validar com `model-writer` no `/plan`.

