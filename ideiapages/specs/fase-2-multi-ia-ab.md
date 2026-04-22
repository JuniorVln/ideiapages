---

## fase: fase-2-multi-ia-ab

status: draft
created: 2026-04-22
owner: junior

# Spec — Fase 2: Multi-IA + A/B Testing

## Objetivo

Escalar de **5-10 páginas manuais** (Fase 1) para **20-50 páginas geradas por 3 LLMs** (Claude, GPT, Gemini), cada uma submetida a um **quality gate automático** e publicada em **A/B activo**, com vencedor declarado por **significância estatística** sobre a taxa de conversão (lead / sessão). O objetivo é descobrir qual modelo + prompt + estilo de página converte mais para o nicho Ideia Chat, transformando o processo de criação de páginas em um **motor reproduzível de experimentação**.

## Contexto

A Fase 1 validou que o funil converte (`≥ 1%` de leads por sessão). Agora a questão é: **qual IA escreve a melhor página** para cada intent? A hipótese é que diferentes modelos performam melhor para diferentes tipos de termo (informacional vs. comercial vs. comparativo). Sem A/B real, qualquer decisão de "qual IA usar" é palpite. Esta fase introduz o domínio `generation` com 3 generators isomórficos e o domínio `experiments` que assina variação, mede conversão e declara vencedor. Também introduz **prompt engineering versionado** em `references/prompts/`.

## Escopo da fase (behaviors envolvidos)

Esta fase materializa behaviors nos domínios `generation` e `experiments`:

1. `generation/claude-generator` — Claude (Sonnet) gera página completa a partir de briefing
2. `generation/gpt-generator` — GPT (modelo equivalente mais recente) gera a mesma estrutura
3. `generation/gemini-generator` — Gemini (modelo equivalente mais recente) gera a mesma estrutura
4. `generation/quality-gate` — valida cada saída (SEO, factual vs `product_facts`, design system, comprimento, estrutura)
5. `experiments/assign-variation` — edge middleware distribui usuários entre variações A/B/C
6. `experiments/track-metrics` — agrega pageviews, leads e conversões por variação
7. `experiments/declare-winner` — compara variações com teste de significância (chi-quadrado / proporções) e declara vencedora quando atinge tamanho amostral + p-value

Cada generator compartilha **contrato único** (input = briefing, output = estrutura de página validável). Prompt templates ficam versionados em `references/prompts/generate-page.<intent>.md`.

## Triggers

1. **Operador (Júnior)** seleciona um termo `briefing_pronto` e dispara geração com `ideiapages-research generate-page --termo-id <id> --providers claude,gpt,gemini`
2. **Sistema** gera 3 variações em paralelo; `quality-gate` aprova/rejeita cada uma
3. **Operador** revisa variações rejeitadas (razão do gate), opcionalmente edita prompt ou refaz
4. **Operador publica** as variações aprovadas como uma **rodada A/B** na mesma URL
5. **Visitante** chega na URL → middleware atribui variação deterministicamente (hash do visitor_id) → loga exposição
6. **Visitante** converte ou não → `track-metrics` acumula sessões + leads por variação
7. **Sistema (cron/CLI)** roda `declare-winner` diariamente sobre experimentos ativos que atingiram tamanho amostral; experimentos com vencedor passam a servir só a vencedora (com pequena % de tráfego de controle para regressão)

## Comportamentos esperados (alto nível)

### Fluxo principal end-to-end

1. Prompt templates versionados por `intent` existem em `references/prompts/generate-page.<intent>.md` (informacional, comercial, comparativo, tutorial, vs-concorrente)
2. CLI `generate-page` lê briefing da Fase 0 + prompt do intent + `product_facts` e dispara 3 generators em paralelo
3. Cada generator devolve objeto estruturado (JSON) com: title, meta_description, hero, headings[], parágrafos, FAQ, CTAs, schema_org[]
4. `quality-gate` valida em série:
   - Comprimento mínimo e máximo por seção
   - Todos os `product_facts` críticos citados corretamente (sem inventar preço, número de clientes, etc.)
   - Estrutura obrigatória presente (H1 único, H2s coerentes, FAQ se briefing pede)
   - Keyword principal no title/H1/primeiro parágrafo
   - CTAs seguindo `conversion_principles.md`
   - Sem anti-palavras ("revolucionário", "único do mercado" sem prova)
5. Variações aprovadas viram registros em `variacoes` ligadas ao `pagina_id` + `provider` + `prompt_version`
6. Operador publica a rodada (muda `status_experimento` para `ativo` na página)
7. Edge middleware atribui a variação na primeira visita (cookie `exp_<pagina_id>`); visitas subsequentes mantêm a mesma variação
8. `track-metrics` escreve na tabela `metricas_diarias` agregado diário por `variacao_id` (sessões, leads, conversão)
9. `declare-winner` roda diariamente: para experimentos com ≥ N sessões por braço (ex: 500) e diferença significativa (p < 0.05), marca vencedor; demais continuam ativos
10. Relatório final da fase consolida: qual provider mais venceu, qual intent cada um performou melhor, custo por lead por provider

### Modo de operação esperado

- **Reproduzibilidade**: todo prompt tem `version`; cada `variacoes` salva `prompt_version` + `provider` + `model_version`
- **Custo rastreável**: cada geração grava tokens de entrada/saída e custo estimado
- **Atribuição determinística**: mesmo `visitor_id` sempre vê a mesma variação enquanto o experimento rodar
- **Rollback seguro**: encerrar experimento faz o render padrão voltar à vencedora (ou fallback original se nenhuma foi eleita)
- **Isolamento de contratos**: generators só recebem briefing + product_facts + prompt template; não acessam o DOM final nem o banco diretamente
- **Quality gate determinístico**: dada a mesma saída, retorna o mesmo veredito (regras explícitas, sem LLM-judge no MVP — LLM-judge opcional e documentado como "soft gate")

## Entradas

- Fase 1 aprovada: funil funcional com ≥ 1% de conversão e tracking GA4/GSC operando
- ≥ 20 termos com `briefing_pronto` (pode ser o mesmo pool da Fase 0/1, expandindo se necessário)
- Credenciais em `.env`: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` (ou equivalente)
- Orçamento de geração aprovado (ex: até R$ 500 para a fase inteira)
- Infra de edge middleware no Next.js (Vercel Edge) habilitada
- Design system + componentes de render da Fase 1 estáveis

## Saídas

- **20 a 50 páginas publicadas** com pelo menos 3 variações cada (A/B/C) inicialmente
- Tabela `variacoes` com 60-150 registros (3 por página) + prompt_version + provider + custo
- Tabela `experimentos` registrando status (ativo / vencedor_declarado / encerrado), p-value, lift, tamanho amostral
- Tabela `metricas_diarias` alimentada diariamente por variação
- **Ranking por provider** (qual LLM mais venceu, qual mais foi rejeitada no gate)
- **Taxa de aprovação do quality gate** por provider
- Relatório final em `research/data/relatorios/fase-2-<timestamp>.md` com:
  - Total de páginas geradas, aprovadas, publicadas
  - % de vitórias por provider (global e por intent)
  - Custo total por lead por provider
  - Prompts com melhor desempenho (para guardar como baseline)
  - Exemplos de falhas do quality gate e o que foi aprendido

## Critérios de "feito" (verificáveis no fim)

- 3 generators (claude, gpt, gemini) compartilhando **mesmo contrato de saída** e testes unitários passando com mocks
- Quality gate com cobertura para: comprimento, estrutura, product_facts, CTAs, anti-palavras
- Prompt templates por intent versionados em `references/prompts/generate-page.<intent>.md`
- 20-50 páginas ao ar com ≥ 2 variações ativas cada
- Middleware de atribuição determinística (mesmo visitor_id = mesma variação) auditado
- `metricas_diarias` populada corretamente (reconciliável com GA4 dentro de 5% de erro)
- ≥ 10 experimentos atingiram tamanho amostral e ≥ 5 têm vencedor declarado com p < 0.05
- **Ao menos um provider tem lift estatisticamente significativo** sobre os demais em ao menos 1 intent
- **ROI positivo agregado**: `(leads × valor_médio_lead) − (custo_geração + custo_infra)` > 0 na janela avaliada
- Custo total da fase (geração + infra) ≤ R$ 500 no MVP
- Zero incidente de "vazamento" entre variações (mesmo user vendo mais de uma)
- Zero fato inventado detectado em auditoria manual por amostragem (≥ 10 páginas)
- Documentação de "como adicionar novo provider / prompt / intent" em `research/README.md`
- Aprovação do Júnior registrada em `ROADMAP.md`

## Não-objetivos (out of scope desta fase)

- Geração de imagens / banners por IA — páginas usam bibliotecas existentes ou sem imagens complexas
- Personalização por persona em runtime — A/B é suficiente para este marco
- Multivariate testing (MVT) — só A/B/C puro
- Dashboard interno de performance — Fase 3
- Recomendações automáticas de próxima página — Fase 3
- Auto-rewrite por queda de ranking — Fase 4
- Escala para 100+ páginas — Fase 4
- Integração com ferramentas pagas de experimentação (Optimizely, VWO) — built in-house
- Experimentos multi-página (funil inteiro) — só por página
- LLM-as-judge no quality gate como gate principal — pode ser "soft" / conselho, nunca bloqueio sozinho

## Métricas de sucesso


| Métrica                                                        | Alvo                         |
| -------------------------------------------------------------- | ---------------------------- |
| Páginas geradas + publicadas (com ≥ 2 variações ativas)        | 20-50                        |
| Taxa de aprovação no quality gate (por provider)               | ≥ 70% após 2 iterações       |
| Experimentos com vencedor declarado (p < 0.05) na janela       | ≥ 5                          |
| Lift do vencedor vs segundo lugar (mediana)                    | ≥ 20%                        |
| Custo médio por página gerada (3 variações)                    | ≤ R$ 8                       |
| Custo por lead (todas variações)                               | menor que Fase 1             |
| Reconciliação `metricas_diarias` vs GA4                        | < 5% de diferença            |
| Fatos inventados detectados em auditoria (amostra de 10)       | 0                            |
| Tempo de publicação de novo experimento (briefing → publicado) | < 30 min end-to-end          |


## Riscos / decisões em aberto

1. **Versão exata dos modelos** — usar a mais recente disponível no momento do `/break`; registrar `model_version` em `variacoes` para reprodutibilidade
2. **Formato de saída dos generators** — JSON estruturado (preferido, mais validável) vs. MDX (mais livre); recomendação: JSON com campos obrigatórios
3. **Critério do quality gate** — determinístico (regras) vs. LLM-judge (subjetivo) vs. híbrido; MVP: determinístico obrigatório, LLM-judge como parecer não bloqueante
4. **Base amostral mínima por braço** — 500 sessões é razoável para conversões esperadas > 1%; revalidar no `/plan` com calculadora de tamanho amostral
5. **Regressão após declarar vencedor** — manter 10% de tráfego no controle antigo para detectar mudanças sazonais ou drift? Recomendado sim
6. **Cache de geração** — re-gerar a mesma variação deve ser idempotente; cache por `hash(briefing + prompt_version + model_version)` evita desperdício
7. **Isonomia entre provedores** — mesmo contrato de input (briefing) + mesmo template de prompt; diferenças devem vir apenas do modelo, não do prompt customizado por provider
8. **Privacidade do briefing** — briefing contém estratégia comercial; nunca logar conteúdo completo no GA4/Sentry
9. **Throttling e retries** — cada provider tem rate limits diferentes; cliente Python deve uniformizar (retry exponencial, timeout consistente)
10. **Custo dispara com múltiplas iterações** — operador precisa de `--dry-run` e estimativa de custo antes de executar em lote

## Próximo passo após `/spec`

Rodar `/break fase-2-multi-ia-ab` para gerar as issues (ordem típica: prompts versionados → contrato compartilhado dos generators → 3 generators → quality-gate → tabela `experimentos` + middleware → track-metrics → declare-winner → primeira rodada de páginas → relatório).
