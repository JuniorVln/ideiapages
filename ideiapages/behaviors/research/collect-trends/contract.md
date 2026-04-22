---
behavior: research/collect-trends
status: draft
created: 2026-04-16
owner: junior
---

# Spec — Collect Google Trends

## Objetivo

Para cada termo coletado, buscar **dados de tendência do Google Trends** (interesse ao longo do tempo, sazonalidade, queries relacionadas em alta) e persistir junto ao termo como insumo para priorização. Permite distinguir termos em ascensão de termos em declínio antes de investir na criação da página.

## Contexto

Volume de busca absoluto é caro (DataForSEO, Semrush). Trends entrega o **sinal direcional gratuito**: o termo está crescendo, estável ou caindo? Tem sazonalidade óbvia (ex: "imposto de renda" picando em março/abril)? Queries relacionadas estão emergindo? Esse contexto evita o erro de criar 50 páginas para um tema que está em decadência.

## Triggers

1. **Operador roda comando manual** para uma keyword específica (string)
2. **Sistema executa em lote** para termos com `status = 'analisado'` que ainda não têm dados de tendência
3. **Refresh trimestral** (futuro) — atualiza dados de tendência dos termos ativos com páginas no ar

## Comportamentos esperados

### Trigger 1: Coleta manual para uma keyword

1. Operador fornece keyword (string)
2. Sistema verifica se a keyword existe na tabela `termos` — se não, opcionalmente cadastra com `fonte = 'seed'` ou só executa modo "consulta" sem persistir
3. Sistema verifica cache de tendência (< 30 dias) — se válido, retorna do cache
4. Sistema dispara consulta ao Google Trends:
   - Geo: BR
   - Timeframe: últimos 12 meses (configurável)
   - Categoria: padrão (sem filtro)
5. Sistema processa resposta extraindo:
   - Série temporal (uma linha por ponto: data, interesse 0-100)
   - Tendência geral: `crescente`, `estavel`, `decrescente` (heurística sobre regressão linear da série)
   - Sazonalidade detectada: pico mensal médio, mês de pico
   - Top 5 queries relacionadas (rising)
   - Top 5 queries relacionadas (top)
6. Sistema persiste em `tendencia_pytrends` (jsonb) na tabela `termos`
7. Sistema retorna resumo no console: tendência, mês de pico, queries em alta, custo (deve ser zero — pytrends é grátis)

### Trigger 2: Lote de termos analisados

1. Sistema busca termos com `status = 'analisado'` sem dados de tendência (ou cache > 30 dias)
2. Para cada, executa Trigger 1 com pausa de 2-5s entre chamadas (rate limit anti-ban do pytrends)
3. Em caso de bloqueio (HTTP 429 do Trends), pausar e retentar com backoff
4. Gera relatório consolidado

### Modo dry-run

Faz consulta mas não persiste, só imprime.

## Estados

- **Idle**
- **Querying** — chamando pytrends
- **Processing** — extraindo tendência e sazonalidade
- **Persisting**
- **Rate-limited** — pausando devido a 429
- **Failed** — falha persistente (ex: keyword sem dados)

## Entradas / Saídas

**Entradas**:
- Keyword (string) ou nada (lote)
- Timeframe (string padrão pytrends, default `today 12-m`)
- Geo (string, default `BR`)
- Categoria (int, default `0` — todas)
- Cache em dias (int, default 30)
- `dry_run`, `force` (booleans)

**Saídas**:
- Update em `termos.tendencia_pytrends` (jsonb com série + tendência + queries relacionadas)
- Resumo no console
- Log JSON estruturado

## Dependências

- Tabela `termos` (lê e atualiza)
- Cliente pytrends (Python, grátis, não-oficial)
- Configuração de hl/tz (`pt-BR`, `tz=180` para BR)

Sem dependência de outros behaviors.

## Regras de negócio

1. **Custo zero por design** — pytrends é grátis. Se algum dia migrar para Apify Google Trends actor, anotar custo.
2. **Rate limit obediente** — pytrends bane se abuso. Pausa mínima 2s entre keywords no lote, 5s recomendado.
3. **Tolerância a "no data"** — algumas keywords são tão específicas que Trends não tem dados. Marcar `tendencia_pytrends = { status: 'no_data' }` e seguir.
4. **Cache de 30 dias** — Trends muda pouco no curto prazo
5. **Privacidade** — pytrends não envia dados sensíveis, não há concern de PII
6. **Sazonalidade simples** — MVP detecta apenas pico mensal médio. Análise estatística mais robusta (autocorrelação, FFT) fica para iteração 2
7. **Heurística de tendência** — regressão linear sobre os últimos 12 pontos: slope > +0.5 = crescente, < -0.5 = decrescente, entre = estável (configurável)

## Critérios de aceitação

- [ ] Para uma keyword popular (ex: "atendimento whatsapp"), retorna série temporal de 12 meses com 50+ pontos
- [ ] Tendência classificada como `crescente`, `estavel` ou `decrescente`
- [ ] Mês de pico identificado (1-12)
- [ ] Queries relacionadas em alta (top 5) extraídas quando disponíveis
- [ ] Resultado persistido em `termos.tendencia_pytrends` como JSONB válido
- [ ] Cache de 30 dias respeitado, `--force` ignora cache
- [ ] Lote de 30 termos completa em < 4 minutos (com pausas anti-rate-limit)
- [ ] Bloqueio 429 detectado e backoff aplicado, sem matar o lote
- [ ] Keyword sem dados marcada como `no_data`, não falha o behavior
- [ ] Modo `--dry-run` não persiste
- [ ] Custo total: R$ 0,00

## Não-objetivos (out of scope)

- Volume absoluto de busca (Trends não dá isso — é índice 0-100)
- Análise estatística sofisticada (autocorrelação, decomposição)
- Comparação multi-keyword no mesmo gráfico (Trends suporta, mas não precisamos no MVP)
- Forecasting (predição futura) — virá em behaviors de Fase 4
- Trends regional dentro do Brasil (estado/cidade) — anotado para futuro
- Integração com Apify Google Trends actor (alternativa caso pytrends seja banido)

## Métricas de sucesso

| Métrica | Alvo |
|---------|------|
| Taxa de keywords com dados (vs `no_data`) | ≥ 70% |
| Tempo médio por keyword | ≤ 5s (incluindo pausa) |
| Custo total | R$ 0,00 |
| Lote de 30 sem ban | 100% |
| Tendência classificada coerente (validação manual de amostra) | ≥ 80% |

## Riscos / decisões em aberto

1. **pytrends é não-oficial** — Google pode mudar API e quebrar a lib. Mitigação: monitorar PyPI updates, ter Apify Google Trends actor como plano B documentado.

2. **Bans IP** — usar muito pode causar bloqueio temporário. Mitigação: pausa generosa entre chamadas, retry com backoff. Em produção, considerar proxy rotativo.

3. **Heurística de tendência simples**: regressão linear é grosseira. Pode classificar errado termos com sazonalidade forte (ex: "imposto de renda" cai em agosto = decrescente, mas é só sazonal). Iteração 2 deve fazer detrending.

4. **Categoria do Trends**: começamos com `0` (todas). Para keywords ambíguas (ex: "ideia chat" pode confundir com "chat" geral), categoria específica ajuda. Decidir no `/plan` se vale a complexidade.

5. **Migração para Apify Google Trends**: o actor existe e custa créditos. Se pytrends for banido, alternar é simples (mesmo schema de dados). Documentar a flag de provider em `settings`.

6. **Persistência de série completa em JSONB**: ~12 meses × 4 pontos/mês = 48-52 pontos. JSONB suporta tranquilo. Não precisa tabela separada para série temporal nesta escala.

7. **Comportamento sem internet**: pytrends falha silenciosamente em algumas situações. Garantir log claro de erro de rede vs ban vs no_data.
