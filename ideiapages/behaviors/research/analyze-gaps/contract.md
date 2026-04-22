---

## behavior: research/analyze-gaps
status: draft
created: 2026-04-16
owner: junior

# Spec — Analyze Content Gaps (Information Gain)

## Objetivo

Para cada termo `priorizado` com snapshot SERP e conteúdo concorrente raspado, usar um LLM para identificar **lacunas de cobertura** (gaps) entre o que os concorrentes oferecem e o que **deveríamos oferecer** para conquistar Information Gain. Output: lista priorizada de tópicos, ângulos, formatos e dados que nossa página deve cobrir além do que já existe.

## Contexto

Information Gain é o que coloca página acima da média do SERP. Sem essa análise, escrevemos só o "óbvio" que todo mundo já cobre — virando mais uma página repetindo a mesma coisa. Esse behavior fecha o ciclo: SERP coletada → conteúdo raspado → **gaps identificados** → input para `generation/claude-generator` ter munição factual e estrutural para criar uma página realmente superior.

## Triggers

1. **Operador roda comando manual** para um termo priorizado específico
2. **Sistema executa em lote** para todos os termos `priorizado` que ainda não têm análise de gaps
3. **Cascade automático** quando `generation/*` precisa do briefing para gerar a página
4. **Re-análise manual** quando concorrentes mudaram (novo snapshot + novo scrape) ou quando prompt evoluiu

## Comportamentos esperados

### Trigger 1: Análise manual para um termo

1. Operador fornece UUID do termo
2. Sistema valida pré-condições:
  - Termo em `status = 'priorizado'` (ou `analisado` com flag `--allow-analyzed`)
  - Snapshot SERP existe e tem ≥ 5 resultados
  - Conteúdo raspado existe para ≥ 5 URLs do snapshot
3. Se faltar pré-condição, oferece cascade automático para os behaviors faltantes (com confirmação) ou aborta com mensagem clara
4. Sistema lê:
  - Termo (keyword, intencao, cluster)
  - Conteúdo raspado dos top 10 (markdown completo + estrutura)
  - `references/product_facts.md`
  - `references/seo_rules.md` (Quality Gate)
  - Template em `references/prompts/analyze-gaps.md`
5. Sistema monta prompt:
  - System: persona analista SEO, schema do output, anti-alucinação
  - User: termo, intent classificado, resumos estruturados de cada concorrente (H1+H2+H3+resumo de 200 palavras), product facts
6. Sistema chama Claude Sonnet (gap analysis exige raciocínio melhor que Haiku — confirmar no `/plan`)
7. Sistema valida output JSON:
  - Lista de tópicos cobertos por TODOS (commodity, devemos cobrir)
  - Lista de tópicos cobertos por POUCOS (oportunidade de diferenciação)
  - Lista de tópicos AUSENTES em todos (Information Gain puro — máxima oportunidade)
  - Lista de formatos/elementos sugeridos (FAQ, tabela comparativa, calculadora, vídeo, depoimento)
  - Lista de dados/fatos específicos do Ideia Chat a destacar
  - Word count alvo (média dos top + delta)
  - Estrutura de headings sugerida (H1 + lista de H2 com sub-H3)
  - Avisos de quality gate (ex: "evitar prometer X sem dado")
8. Sistema persiste briefing em `briefings_seo` (tabela nova) vinculado ao termo
9. Sistema atualiza `termos.status = 'briefing_pronto'` (ou similar — confirmar no data_model)
10. Sistema retorna resumo: 3 maiores oportunidades de gap, formato sugerido, custo

### Trigger 2: Lote de termos priorizados

1. Sistema busca termos `priorizado` sem briefing recente (< 60 dias)
2. Para cada, executa Trigger 1 com pausa entre chamadas
3. Reporta consolidado: termos analisados, falhas, custo total

### Trigger 3: Cascade do generation

1. Behavior de geração precisa do briefing
2. Sistema verifica cache; se ausente, executa Trigger 1 silenciosamente
3. Retorna briefing pronto

### Modo dry-run

Faz chamada LLM, não persiste, imprime JSON e custo.

## Estados

- **Idle**
- **Resolving** — verificando pré-condições, cascade se necessário
- **Loading** — carregando markdown dos concorrentes (pode ser MB+ de texto)
- **Compressing** — resumindo cada concorrente para caber no contexto (preprocessing)
- **Calling-LLM**
- **Validating**
- **Persisting**
- **Failed** — pré-condições insuficientes (ex: < 5 concorrentes raspados)

## Entradas / Saídas

**Entradas**:

- UUID do termo (Trigger 1) ou nada (lote)
- `--prompt-version` (default último)
- `--top-n` (quantos concorrentes considerar, default 10)
- `--cache-days` (cache de briefing, default 60)
- `dry_run`, `force` (booleans)

**Saídas**:

- Registro em `briefings_seo` (jsonb com toda a estrutura de gaps)
- Update em `termos.status` para `briefing_pronto` (ou equivalente)
- Resumo no console: top 3 gaps, formato, custo
- Log JSON estruturado
- (opcional) markdown legível do briefing salvo em `data/briefings/<termo_id>.md` para revisão humana

## Dependências

- Tabela `termos` (lê e atualiza)
- Tabela `serp_snapshots` (lê)
- Tabela `conteudo_concorrente` (lê)
- Tabela `briefings_seo` (escreve) — nova, criada por `model-writer`
- Cliente Claude
- `references/prompts/analyze-gaps.md` (criado por `prompt-engineer`)
- `references/product_facts.md`, `references/seo_rules.md`
- Cascade opcional: `collect-serp`, `scrape-competitors`

## Regras de negócio

1. **Pré-condições rigorosas** — não gera briefing sem dados (≥ 5 concorrentes raspados). Briefing baseado em corpus magro vira lixo
2. **Compressão de concorrentes** — markdown completo do top 10 pode passar de 100k chars; antes de mandar para Claude, aplicar resumo estruturado por página (preservando H2/H3 + corpo resumido em ~500 palavras). Isso é processamento local (sem LLM) — extração estruturada
3. **Anti-alucinação dupla** — (a) LLM só pode falar do produto Ideia Chat com base em `product_facts.md`; (b) gaps identificados devem ser **ancorados em evidência** (qual concorrente NÃO cobre o quê), não inventados
4. **Quality Gate alinhado a `seo_rules.md`** — output do briefing já vem com word count alvo, número mínimo de H2, presença de FAQ, etc., compatível com Quality Gate
5. **Versionamento de briefing** — toda análise registra `prompt_version` e `model`. Re-análise é opt-in
6. **Cache de 60 dias** — gaps mudam quando concorrentes atualizam conteúdo. 60 dias é razoável; refresh manual quando snapshot for atualizado
7. **Custo controlado** — Sonnet com 10 concorrentes resumidos fica em ~30-50k tokens input, ~5k output. Custo estimado R$ 1-3 por termo. Alerta se passar disso
8. **Falha resiliente** — se LLM devolve JSON inválido, retentar 2x; se persistir, marcar termo como `falha_briefing` e seguir o lote

## Critérios de aceitação

- Para um termo com 10 concorrentes raspados, sistema gera briefing em < 90s
- Briefing contém: tópicos commodity, tópicos diferenciadores, gaps puros, formatos sugeridos, dados Ideia Chat, word count alvo, estrutura de headings, avisos de quality gate
- Cada gap identificado cita evidência (qual concorrente não cobre)
- Estrutura de headings sugerida é compatível com Quality Gate de `seo_rules.md`
- Word count alvo é maior que a média do top 3 e menor que 3x essa média (sanidade)
- Termo avança para `status = 'briefing_pronto'`
- Pré-condições insuficientes resultam em mensagem clara, não em briefing fraco
- Cache de 60 dias respeitado, `--force` ignora
- Custo por briefing ≤ R$ 3,00 (Sonnet)
- Lote de 10 termos completa em < 20 min
- Modo `--dry-run` não persiste
- Briefing legível em markdown gerado para revisão humana

## Não-objetivos (out of scope)

- Geração da página em si (será feito em `generation/*`)
- Comparação A/B entre briefings (não há A/B aqui)
- Score de qualidade do briefing pelo próprio LLM (auditor humano faz no MVP)
- Análise de backlinks ou autoridade dos concorrentes (escopo de SEO técnico, fora do MVP)
- Tradução / multilíngue
- Detecção automática de ângulos polêmicos (ético/legal a evitar) — humano modera
- Análise de UX/visual dos concorrentes (apenas conteúdo textual)

## Métricas de sucesso


| Métrica                                                  | Alvo      |
| -------------------------------------------------------- | --------- |
| Taxa de briefings válidos                                | ≥ 95%     |
| Custo por briefing                                       | ≤ R$ 3,00 |
| Tempo médio por briefing                                 | ≤ 90s     |
| Gaps acionáveis identificados (auditoria humana)         | ≥ 70%     |
| Briefings que viram páginas que rankeiam top 10 (futuro) | ≥ 30%     |
| Word count alvo aderente (média top + 20-50%)            | sim       |


## Riscos / decisões em aberto

1. **Compressão de concorrentes para caber no contexto**: 10 páginas × 5k palavras = ~250k tokens. Excede contexto da maioria dos modelos. Soluções:
  - **Resumo extrativo** local (tirar só H2/H3 + primeiras N frases de cada seção) — barato, pode perder nuance
  - **Resumo abstrativo** com Haiku (uma chamada por concorrente para resumir em 500 palavras) — custa um pouco, qualidade alta, depois agrega
  - **Map-reduce com Sonnet** (chunks paralelos de análise + síntese final) — complexo
   **Decisão recomendada**: começar com **resumo extrativo** (heading + primeiras 3 frases de cada seção). Se qualidade dos gaps for fraca, evoluir para resumo abstrativo com Haiku.
2. **Modelo: Sonnet ou Opus?** Opus seria melhor para raciocínio crítico, mas custo é proibitivo no volume. **Sonnet** parece o ponto certo. Validar com amostra.
3. **Tabela `briefings_seo`**: schema preliminar:
  ```
   id, termo_id, prompt_version, model, briefing_jsonb, custo_brl, criado_em
  ```
   Confirmar com `model-writer` no `/plan`.
4. **Status do termo após briefing**: criar valor `briefing_pronto` ou reusar `analisado`? Recomendado adicionar valor explícito ao enum `TermStatus` (`briefing_pronto`) para clareza no funil.
5. **Briefing como markdown legível**: para Júnior revisar manualmente termo a termo. Vale gerar arquivo .md acompanhando o jsonb? Custo zero, conveniência alta. **Decisão**: sim.
6. **Versionamento de briefing**: substituir vs histórico? Recomendado **histórico em jsonb array** ou tabela à parte. Decidir no `/plan`.
7. **Validação semântica do output**: além do schema JSON, vale ter um segundo LLM auditor (com `quality-reviewer` agent)? MVP fica sem isso — humano valida amostra. Opt-in para iteração 2.
8. **Falsos positivos de "gap puro"**: LLM pode achar gap que na verdade ninguém procura (ninguém cobre porque ninguém quer). Mitigação: cruzar gaps com tendência de queries relacionadas do `collect-trends`. Anotar como melhoria.
9. **Como o briefing é consumido pelo `generation`**: API direta lendo da tabela ou export para arquivo? Recomendado **API via behavior** (sem acoplamento de arquivos). Definir contrato no spec de `generation/claude-generator`.

