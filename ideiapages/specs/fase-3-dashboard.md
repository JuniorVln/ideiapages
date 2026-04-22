---

## fase: fase-3-dashboard

status: draft
created: 2026-04-22
owner: junior

# Spec — Fase 3: Dashboard

## Objetivo

Entregar um **dashboard interno** (somente operador) que transforma os dados acumulados nas Fases 0-2 em **decisões acionáveis**: quais páginas performam, qual IA + prompt + cluster + intent está ganhando, qual o custo vs ROI por página, e **o que fazer a seguir** (próximas páginas a criar, candidatos a A/B refresh, concorrentes novos na SERP). Sem essa camada, a operação depende de queries manuais no Supabase e o conhecimento fica preso na cabeça do Júnior.

## Contexto

A Fase 2 deixa o sistema cheio de sinais: sessões, leads, variações vencedoras, custo por provider, significância estatística. O próximo gargalo não é coletar mais dados — é **ler e agir sobre os dados que já existem**. Esta fase é **100% web** (Next.js + Supabase), **zero público** (protegida por auth, rota `/admin/*`), e **não gera nem publica páginas**. A proposta é **consolidar decisões** e preparar o terreno para a automação da Fase 4 (autocura). Tudo o que o dashboard recomenda, a Fase 4 vai começar a **executar sozinho**.

## Escopo da fase (behaviors envolvidos)

Esta fase materializa behaviors no domínio `dashboard` (novo sub-domínio dentro de `rendering`/`monitoring` — a decisão exata vem no `/break`):

1. `dashboard/performance-view` — visão consolidada por página, por variação, por cluster, por IA
2. `dashboard/cost-roi-view` — custo por página, por lead, por provider + ROI agregado
3. `dashboard/recommendations-engine` — motor de recomendações (próximas páginas, A/B refresh, termos em alta)
4. `dashboard/auth-guard` — proteção da rota `/admin/*` (Supabase Auth + allowlist de emails)
5. *(eventual)* `dashboard/export` — export CSV/JSON das tabelas de métricas para auditoria offline

Não há domínio novo de banco — o dashboard **consome** as tabelas já existentes (`paginas`, `variacoes`, `experimentos`, `metricas_diarias`, `leads`, `briefings_seo`, `termos`) e cria no máximo **views materializadas** e **tabelas auxiliares** para performance de leitura.

## Triggers

1. **Operador (Júnior)** abre `/admin/dashboard` após login → vê panorama geral do portfólio
2. **Operador** filtra por período (7d, 30d, 90d, custom), por IA (Claude/GPT/Gemini), por intent, por cluster
3. **Operador** clica numa página específica → vê histórico de variações, vencedora atual, leads gerados, custo, posição no GSC
4. **Operador** abre aba "Recomendações" → vê top termos da Fase 0 ainda não publicados, candidatos a novo A/B, concorrentes novos na SERP
5. **Sistema** recomputa métricas agregadas a cada X minutos (cron / Supabase edge function / materialized view refresh)
6. **Operador** exporta CSV com dados filtrados para apresentar numa reunião

## Comportamentos esperados (alto nível)

### Fluxo principal end-to-end

1. Rota `/admin/*` protegida por Supabase Auth + allowlist (lista de emails permitidos em `.env` ou tabela)
2. Home do dashboard mostra KPIs do topo:
   - Total de páginas publicadas
   - Sessões e leads no período
   - Conversão agregada (com comparativo vs período anterior)
   - Custo total (geração + infra) e ROI estimado
   - % de experimentos com vencedor declarado
3. Tabela principal lista páginas com colunas: slug, intent, cluster, provider_vencedor, sessões, leads, conversão, custo_por_lead, status_experimento, ranking_gsc
4. Clicando numa página: drill-down com histórico de variações, diffs de prompt entre versões, gráfico de conversão ao longo do tempo, posição GSC por termo
5. Aba "Portfólio por IA": gráficos comparando Claude vs GPT vs Gemini por intent, por cluster, por período
6. Aba "Recomendações":
   - **Próximas páginas a criar**: termos com `status = 'briefing_pronto'` ordenados por score × tendência × volume, ainda não publicados
   - **A/B refresh**: páginas com conversão em queda há ≥ X dias (sugerir nova rodada A/B)
   - **Concorrentes novos**: termos onde a SERP mudou (novos domínios no top 10 desde o último snapshot)
7. Aba "Custos": detalhamento de custo por API (Anthropic, OpenAI, Google AI, Apify, Firecrawl), por fase, por mês
8. Export CSV/JSON disponível em cada tabela

### Modo de operação esperado

- **Somente leitura** do ponto de vista de negócio (dashboard não cria páginas, não dispara geração; apenas recomenda)
- **Server Components** para páginas pesadas; client components apenas para filtros interativos e gráficos
- **Cache**: KPIs agregados em view materializada recalculada a cada 5-15 min; drill-down lê direto (dados recentes)
- **Segurança**: RLS garante que somente usuários em allowlist veem dados agregados; operador nunca consegue ler dados brutos de visitantes (emails de leads) sem permissão específica
- **Performance**: cada aba carrega em < 1.5s com 50 páginas + 150 variações no banco
- **Observabilidade**: o próprio dashboard tem sinais de saúde (última atualização de métricas, latência da view materializada)

## Entradas

- Fase 2 aprovada (vencedores declarados em ≥ 5 experimentos, ROI positivo)
- `paginas`, `variacoes`, `experimentos`, `metricas_diarias`, `leads`, `briefings_seo`, `termos` populados e consistentes
- Supabase Auth habilitado no projeto
- Lista inicial de emails autorizados a acessar `/admin/*`
- Biblioteca de gráficos definida (recomendação MVP: `recharts` ou `@tremor/react`)

## Saídas

- Rotas `/admin/dashboard`, `/admin/pages/[slug]`, `/admin/providers`, `/admin/recommendations`, `/admin/costs` funcionais
- Views materializadas ou RPCs Supabase (`mv_performance_por_pagina`, `mv_custo_por_provider`, `rpc_recommendations_next_pages`) documentadas
- Dashboard acessível em produção para a allowlist
- Documentação "como adicionar uma nova métrica ao dashboard" em `web/README.md` (+ `behaviors/dashboard/README.md`)
- Ao menos 1 decisão operacional tomada a partir de recomendação do dashboard (ex: "criar página X", "refresh A/B da página Y") antes de encerrar a fase

## Critérios de "feito" (verificáveis no fim)

- `/admin/*` protegida por Supabase Auth + allowlist; usuário não autorizado recebe 403
- Home do dashboard carrega todos os KPIs em < 1.5s (p95) com dados reais
- Drill-down por página mostra timeline de variações e conversão ao longo do tempo
- Aba "Recomendações" lista ≥ 5 próximas páginas candidatas, ≥ 1 A/B refresh candidato, destaca concorrentes novos onde aplicável
- Aba "Custos" concilia custo total ± 5% com soma das tabelas-fonte
- Export CSV funciona em todas as tabelas principais
- Nenhuma query do dashboard quebra ao rodar com base vazia (empty state adequado)
- Zero vazamento de dados sensíveis (email de lead não aparece agregado em URL, screenshots auditados)
- Aprovação do Júnior registrada em `ROADMAP.md`

## Não-objetivos (out of scope desta fase)

- Tomar ação automática (gerar página, publicar, refresh A/B) — Fase 4 faz isso
- Dashboard público para clientes / investidores — é interno
- Integração com Google Analytics como fonte autoritativa — GA4 é comparação, não fonte (a fonte é Supabase)
- Relatórios agendados por email / Slack — pode entrar em Fase 4 como oportunidade
- Dashboard multi-tenant (múltiplos nichos na mesma UI) — MVP foca só em Ideia Chat
- BI profissional (Metabase, Looker) — se necessário, fica como fallback off-project, não substitui
- Pesquisa de novos termos (isso é Fase 0)
- Edição inline de conteúdo da página — dashboard só mostra dados; para editar, usa o editor da Fase 1/2

## Métricas de sucesso


| Métrica                                                             | Alvo                   |
| ------------------------------------------------------------------- | ---------------------- |
| Tempo de carregamento da home do dashboard (p95)                    | < 1.5 s                |
| Frescor dos KPIs agregados (atraso máximo)                          | ≤ 15 min               |
| Nº de decisões operacionais apoiadas pelo dashboard no 1º mês       | ≥ 5                    |
| Páginas publicadas a partir de recomendação em 1º mês               | ≥ 3                    |
| Refreshes de A/B sugeridos e executados em 1º mês                   | ≥ 2                    |
| Divergência entre custo consolidado vs soma das fontes              | ≤ 5%                   |
| Acesso não autorizado bloqueado corretamente (testado)              | 100% dos casos         |
| Queries com latência > 500 ms                                       | 0 na home              |


## Riscos / decisões em aberto

1. **Biblioteca de gráficos** — `recharts` (mais flexível) vs `@tremor/react` (mais rápido de montar dashboards); decidir no `/plan`
2. **View materializada vs query on-demand** — refresh periódico pode ficar obsoleto durante picos; compromisso: views para home/abas pesadas, queries diretas para drill-downs
3. **Integração GSC** — ranking vem da API Search Analytics; precisa de service account ou OAuth? Documentar no `/break` do behavior `dashboard-gsc-sync`
4. **Critério de "conversão em queda"** — queda de X% sobre média móvel de Y dias? Decidir valores no `/plan` do `recommendations-engine`
5. **Allowlist estática vs tabela** — tabela `admin_users` é mais flexível (sem redeploy); MVP pode ser `.env` para simplicidade
6. **Export com dados de leads** — requer atenção LGPD; exportar pseudonimizado por padrão, com opção "dados completos" restrita
7. **Gráficos em Server Components** — muitas libs de gráfico exigem client; isolar o cliente-side no menor componente possível para performance
8. **Quando arquivar experimentos no dashboard** — experimentos "encerrados" ainda aparecem por N dias? Definir política de retenção
9. **Fuso horário** — KPIs diários devem ser em `America/Sao_Paulo`; validar em todos os agregados
10. **Dark mode** — desejável mas não bloqueante; considerar no design system para operador

## Próximo passo após `/spec`

Rodar `/break fase-3-dashboard` para gerar as issues (ordem típica: auth-guard + layout `/admin` → views materializadas / RPCs → home KPIs → página de detalhe por página → abas provider/custo/recomendações → export CSV → observabilidade e polish).
