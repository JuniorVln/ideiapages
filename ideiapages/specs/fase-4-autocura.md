---

## fase: fase-4-autocura

status: draft
created: 2026-04-22
owner: junior

# Spec — Fase 4: Autocura + Escala

## Objetivo

Transformar IDeiaPages em um sistema **auto-operante**: monitorar continuamente o ranking das páginas no Google Search Console, **detectar quedas**, **reescrever páginas** automaticamente com base em snapshot SERP atualizado + briefing revisto, e **escalar o portfólio para 100+ páginas** sem aumentar proporcionalmente o esforço humano. O Júnior passa de operador (Fases 0-3) para **curador** (Fase 4): aprova, ajusta, mas não opera o dia a dia.

## Contexto

As Fases 0-3 provaram que **descobrir + gerar + testar + medir** funciona. Mas páginas ganham e perdem ranking com o tempo — concorrentes atualizam, Google muda, a SERP se reorganiza. Sem autocura, cada página vira dívida: precisa de manutenção humana. A Fase 4 fecha o loop: os behaviors do domínio `monitoring` observam, decidem, acionam a cadeia já existente (Fase 0: re-snapshot + re-analyze-gaps → Fase 2: regerar variações), e publicam sem intervenção, **dentro de um guardrail explícito**. Esta é a fase em que o projeto deixa de ser "workflow" e vira **produto**.

## Escopo da fase (behaviors envolvidos)

Esta fase materializa behaviors no domínio `monitoring` e agrega um orquestrador de escala:

1. `monitoring/gsc-sync` — poll diário do Google Search Console (impressões, cliques, posição por query)
2. `monitoring/detect-ranking-drop` — aplica regra de queda (posição, cliques, impressões) e cria alerta + candidatura a auto-rewrite
3. `monitoring/auto-rewrite` — orquestra: re-snapshot SERP → re-scrape concorrentes → re-analyze-gaps → regenerar variações (reaproveitando Fase 0 + Fase 2) → publicar nova rodada A/B
4. `monitoring/scale-orchestrator` — agenda criação em lote de páginas novas a partir de briefings `briefing_pronto` respeitando orçamento diário e limite de experimentos simultâneos
5. `monitoring/alerting` — notificação para Júnior (email/Slack/Webhook) em eventos críticos (queda severa, orçamento excedido, API em falha, erro de publicação)
6. `monitoring/safety-gate` — guardrail que pausa automações em caso de sinais suspeitos (drop agregado do portfólio, aumento de custo anormal, falha consecutiva de quality-gate)

Reusa integralmente os behaviors anteriores (`collect-serp`, `scrape-competitors`, `analyze-gaps`, `generate-page`, `quality-gate`, `assign-variation`, `declare-winner`). Não duplica código.

## Triggers

1. **Cron diário (ex: 03:00 BRT)** → `gsc-sync` baixa métricas, atualiza `metricas_diarias`, dispara `detect-ranking-drop`
2. `detect-ranking-drop` encontra página elegível → grava candidato em `auto_rewrite_queue`
3. **Cron horário** → `auto-rewrite` consome `auto_rewrite_queue` respeitando concorrência máxima
4. `auto-rewrite` conclui → publica nova rodada A/B → notifica Júnior
5. **Cron diário de escala** → `scale-orchestrator` olha briefings `briefing_pronto` ainda não publicados e agenda criação respeitando orçamento diário
6. **Evento crítico** (queda agregada, custo disparado, N falhas seguidas) → `safety-gate` pausa automações, notifica imediatamente
7. **Júnior** revisa alertas, aprova/ajusta/descarta, libera fila novamente

## Comportamentos esperados (alto nível)

### Fluxo principal end-to-end

1. Cron `gsc-sync` baixa diariamente dados da Search Analytics API para todas as páginas publicadas
2. `metricas_diarias` recebe linhas com `posicao_media`, `impressoes`, `cliques`, `ctr` por termo + página
3. `detect-ranking-drop` aplica regras (ex: posição caiu ≥ 5 posições na média móvel de 14 dias OU cliques caíram ≥ 40% vs baseline de 30 dias) e cria candidato em `auto_rewrite_queue` com `razao`, `snapshot_id`, `prioridade`
4. `auto-rewrite` executa para cada candidato:
   - Dispara `collect-serp` no termo (snapshot novo)
   - Dispara `scrape-competitors` nas URLs do snapshot novo
   - Dispara `analyze-gaps` produzindo briefing atualizado (nova `versao` em `briefings_seo`)
   - Dispara `generate-page` com 3 providers (ou só o vencedor histórico + 1 challenger, conforme política)
   - Roda `quality-gate` em cada saída
   - Cria nova rodada de `variacoes` e inicia experimento A/B (com 10% tráfego controle mantendo a variação antiga para regressão)
5. `scale-orchestrator` roda diariamente:
   - Verifica orçamento disponível (`custo_diario_max` vs gasto do dia)
   - Seleciona próximos N briefings por score (mesmo algoritmo da Fase 3 "Recomendações")
   - Dispara pipeline de criação (generate → quality-gate → publish com A/B)
   - Para quando orçamento se esgota ou atinge limite simultâneo de experimentos
6. `safety-gate` avalia continuamente:
   - Custo real × custo estimado por hora/dia
   - Quality-gate rejeitando > X% em janela curta (possível drift de prompt ou mudança do modelo)
   - Queda agregada do portfólio em ≥ Y% → pausa automações e notifica
7. Todas as ações automáticas criam registros auditáveis em `automation_log` (quem/o quê/quando/por quê/resultado)

### Modo de operação esperado

- **Autonomia com guardrails**: automações têm limite diário de custo, limite de concorrência, limite de quantidade de rewrites por página em janela de 30 dias
- **Transparência total**: cada ação tem registro; dashboard Fase 3 ganha aba "Autocura" que mostra a fila, os últimos rewrites, custo acumulado, alertas ativos
- **Reversibilidade**: toda nova rodada A/B mantém a variação vencedora anterior como controle; se a nova rodada perde, volta à anterior sem ação humana
- **Idempotência**: reexecutar a mesma entrada da fila não duplica rewrite se o anterior completou
- **Observabilidade**: métricas por stage (gsc-sync, detect, rewrite, scale) em `metricas_coleta`; dashboard mostra SLA
- **Sem regressão de fases anteriores**: nenhum behavior da Fase 0/2 é alterado; reaproveitamento é via orquestração, não via modificação

## Entradas

- Fases 0-3 aprovadas e estáveis
- ≥ 20 páginas publicadas com histórico de pelo menos 30 dias de dados GSC
- Google Search Console API habilitada com credenciais (`service account` ou OAuth) com acesso à propriedade
- Cron scheduler definido (Vercel Cron / GitHub Actions / Supabase cron) e orçamento de jobs aprovado
- `product_facts.md` e `references/prompts/*.md` em estado estável (drift de prompt é risco conhecido)

## Saídas

- **100+ páginas publicadas** com pelo menos 1 rodada A/B cada (incluindo as geradas pela escala)
- Tabela `auto_rewrite_queue` com histórico de candidatos, ações tomadas e resultados
- Tabela `automation_log` com trilha completa de auditoria
- Dashboard Fase 3 ganha aba "Autocura" mostrando fila, rewrites por dia, custo automatizado, taxa de melhora pós-rewrite
- **Evidência quantitativa** de autocura: páginas que caíram e recuperaram ≥ X posições após rewrite automático (amostra > 10)
- Runbooks em `docs/runbooks/` para:
  - Como pausar automações manualmente
  - Como investigar falha de rewrite
  - Como ajustar thresholds de `detect-ranking-drop`
  - Como lidar com esgotamento de orçamento
- Relatório final do projeto em `research/data/relatorios/fase-4-<timestamp>.md` + memorando de encerramento

## Critérios de "feito" (verificáveis no fim)

- `gsc-sync` rodando em produção há ≥ 14 dias sem falha crítica
- `detect-ranking-drop` identificou ≥ 5 candidatos reais e o operador validou que faziam sentido (true positives)
- `auto-rewrite` completou end-to-end em ≥ 5 páginas com nova rodada A/B publicada, sem intervenção humana
- ≥ 50% dos rewrites automáticos produziram melhora em posição média (ou conversão) após 14 dias
- `scale-orchestrator` gerou/publicou páginas novas dentro do orçamento diário, sem ultrapassar limite
- `safety-gate` foi acionado em ≥ 1 evento de teste (chaos test ou real) e pausou corretamente as automações
- Portfólio atinge **≥ 100 páginas publicadas** com pelo menos uma variação ativa
- Nenhum evento de publicação automática gerou conteúdo com fato errado (auditoria por amostragem ≥ 20 páginas) ou anti-palavra listada
- `automation_log` auditável e reconciliável com as tabelas de origem
- Runbooks revisados e testados manualmente
- Aprovação final do Júnior registrada em `ROADMAP.md` (fase 4 encerrada, projeto em operação)

## Não-objetivos (out of scope desta fase)

- Multilíngue ou multi-nicho — IDeiaPages continua em pt-BR e focado em Ideia Chat
- Geração de imagens / vídeos automática — conteúdo continua majoritariamente textual
- Aprendizado de máquina sobre prompts (AutoPrompt) — prompts continuam versionados manualmente
- Integração com redes sociais / distribuição além de Google orgânico
- Sugestão de novos nichos / expansão de produto — é projeto do time de negócio
- Dashboard público ou multi-tenant
- Substituir Fase 3 — a Fase 4 **estende** o dashboard da Fase 3, não reescreve
- Refatorar behaviors anteriores — Fase 4 só acrescenta
- Auto-aprovação de mudanças em `product_facts.md` — fatos continuam sob controle humano
- Remover completamente humano do loop — Júnior continua necessário para aprovação de eventos críticos e curadoria estratégica

## Métricas de sucesso


| Métrica                                                                          | Alvo                        |
| -------------------------------------------------------------------------------- | --------------------------- |
| Páginas publicadas (total)                                                       | ≥ 100                       |
| Rewrites automáticos completos (30 dias)                                         | ≥ 20                        |
| % de rewrites que melhoraram posição/conversão em 14 dias                        | ≥ 50%                       |
| Falsos positivos em `detect-ranking-drop` (amostra de 20)                        | ≤ 20%                       |
| Tempo médio queda → publicação de nova rodada (p50)                              | < 48 h                      |
| Custo automatizado médio por rewrite                                             | ≤ R$ 10                     |
| Eventos de `safety-gate` acionados corretamente (auditoria)                      | ≥ 1 e sem falso pausamento  |
| Incidentes de publicação com conteúdo problemático                               | 0                           |
| Uptime do cron `gsc-sync`                                                        | ≥ 99% em 30 dias            |
| Horas humanas semanais gastas em operação (após estabilização)                   | ≤ 5 h                       |


## Riscos / decisões em aberto

1. **Critérios de "queda"** — posição? cliques? ambos com pesos? Depende do volume; começar com regras simples e calibrar com dados reais da Fase 3
2. **Frequência de sync GSC** — diário é suficiente? alguns sinais aparecem com atraso de 2-3 dias na GSC; considerar agregação móvel para evitar ruído
3. **Orçamento diário automatizado** — definir limite hard (ex: R$ 50/dia) e alertas em ≥ 80%; nunca ultrapassar sem ação humana
4. **Limite de rewrites por página** — no máximo 1 rewrite a cada 30 dias por página, para evitar "flapping" e dar tempo de significância estatística
5. **Drift de prompt / modelo** — modelos mudam silenciosamente; monitorar taxa de aprovação do `quality-gate` para detectar drift e alertar
6. **Concorrência entre auto-rewrite e experimento ativo** — se a página está em experimento com < N sessões, esperar antes de reescrever; regra definida no `/plan`
7. **Safety-gate conservador vs permissivo** — preferir conservador (pausar e avisar) — custo de pausar < custo de publicar lixo
8. **Notificações** — canal (email, Slack, Webhook) e política de severidade a definir; manter alertas com ação clara ("pausado automações X por Y; ação sugerida Z")
9. **Políticas do Google** — auto-geração em escala exige atenção a "Helpful Content Update"; manter quality-gate factual + revisão humana por amostragem
10. **Encerramento do projeto** — "aprovação final" deve incluir: runbooks testados, um mês de operação sem incidente crítico, relatório consolidado para stakeholders

## Próximo passo após `/spec`

Rodar `/break fase-4-autocura` para gerar as issues (ordem típica: `gsc-sync` + tabela `metricas_diarias` expandida → `detect-ranking-drop` → `auto_rewrite_queue` + `auto-rewrite` reusando Fases 0 e 2 → `scale-orchestrator` → `safety-gate` + `alerting` → aba "Autocura" no dashboard → runbooks e validação em produção).
