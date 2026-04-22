---
behavior: research/collect-autocomplete
status: draft
created: 2026-04-16
owner: junior
---

# Spec — Collect Autocomplete

## Objetivo

Descobrir termos de busca reais relacionados a um seed (palavra-chave inicial) coletando sugestões de **autocomplete do Google** e perguntas de **People Also Ask (PAA)**, e persistir cada termo único como candidato para análise posterior.

## Contexto

A pesquisa de termos é o gargalo de qualidade do projeto. Termos ruins → páginas que ninguém procura. Termos genéricos demais → impossível ranquear. Precisamos de um caminho automatizado e **gratuito ou de baixo custo** para mapear o espaço semântico real ao redor de cada seed do nicho (ex: "atendimento whatsapp", "multiplos atendentes whatsapp"). O Google autocomplete é a fonte mais confiável porque reflete buscas reais. PAA complementa com perguntas de intenção informacional.

## Triggers

1. **Operador roda comando manual** com um seed específico para teste rápido
2. **Operador roda pipeline em lote** passando um arquivo de seeds (ex: `seeds/ideia_chat.json`) e o sistema processa todos automaticamente
3. **Sistema executa scheduled run** (futuro, não no MVP) para refresh periódico de seeds aprovados

## Comportamentos esperados

### Trigger 1: Coleta manual para um seed

1. Operador fornece um seed (string) e um limite opcional de termos a coletar (default 50, máximo 500)
2. Sistema valida que o seed tem entre 2 e 200 caracteres
3. Sistema verifica se há coleta recente (< 7 dias) para esse seed exato — se sim, pergunta se quer pular ou forçar nova coleta
4. Sistema dispara consulta de autocomplete do Google para o seed (em pt-BR, geo BR)
5. Sistema dispara consulta de PAA do Google para o seed
6. Sistema deduplica resultados (case-insensitive, trim, normalização de acentos)
7. Sistema descarta termos que: são iguais ao seed; têm menos de 2 chars; contêm caracteres inválidos; estão em lista de stopwords expandida
8. Sistema salva cada termo novo como registro com `fonte = 'autocomplete'` ou `fonte = 'paa'` e `status = 'coletado'`
9. Sistema retorna ao operador: total coletado, total novo, total já existente, total descartado, custo estimado da chamada

### Trigger 2: Coleta em lote a partir de seed file

1. Operador fornece caminho do arquivo JSON com lista de seeds
2. Sistema valida o schema do arquivo (precisa ter `seeds_termos: [string]`)
3. Sistema executa Trigger 1 para cada seed sequencialmente, com pausa configurável entre chamadas (rate limit)
4. Sistema gera relatório resumido ao final: total geral, novos por seed, falhas
5. Sistema persiste log da execução em `metricas_coleta` (tabela auxiliar) para auditoria

### Modo dry-run

Em qualquer trigger, se a flag `dry_run` estiver ativa: o sistema executa as chamadas de leitura mas **não persiste nada no banco**, apenas imprime o que seria salvo.

## Estados

- **Idle** — aguardando trigger
- **Collecting** — chamada externa em andamento
- **Persisting** — salvando no Supabase
- **Reporting** — gerando resumo
- **Failed** — falha externa (rate limit, timeout, API down) — registra erro e segue próximo seed se em lote

## Entradas / Saídas

**Entradas**:
- Seed (string, 2-200 chars) ou arquivo JSON com lista de seeds
- Limite por seed (int, 1-500, default 50)
- Geo (string, default `BR`)
- Idioma (string, default `pt-BR`)
- Flag `dry_run` (bool, default false)
- Flag `force` (bool, default false — ignora cache de 7 dias)

**Saídas**:
- Registros novos na tabela `termos` com fonte `autocomplete` ou `paa`
- Resumo no console (total, novos, duplicados, descartados, custo)
- Log estruturado JSON para arquivo (`research/data/logs/collect-autocomplete-<timestamp>.jsonl`)

## Dependências

- Tabela `termos` no Supabase (criada por outra spec do domínio `research`/`data-model`)
- Provedor externo de autocomplete e PAA (definir via decisão técnica — ver Riscos)
- Cliente Supabase com service_role
- Arquivo de stopwords expandido em `references/stopwords.txt` (a criar)

Não importa código de outros behaviors. Comunica via tabela `termos`.

## Regras de negócio

1. **Idempotência**: rodar duas vezes seguidas para o mesmo seed não duplica termos no banco (chave única em `keyword`)
2. **Normalização**: keyword salva em lowercase, sem espaços extras, sem acentos duplos
3. **Cache de 7 dias**: se houver coleta recente para o mesmo seed, pular por padrão (operador pode forçar com `--force`)
4. **Rate limit obediente**: respeitar limites do provedor externo, com retry exponencial em caso de 429
5. **Atomicidade**: se o batch falhar no meio, o que já foi salvo permanece (não há rollback global)
6. **Privacidade dos seeds**: arquivo de seeds pode conter informação estratégica do cliente — nunca logar o conteúdo completo em produção
7. **Custo trackable**: cada execução registra custo estimado (chamadas × preço da API) para controle financeiro

## Critérios de aceitação

- [ ] Para um seed conhecido (ex: "atendimento whatsapp"), o sistema coleta pelo menos 20 termos relacionados
- [ ] Termos coletados aparecem na tabela `termos` com `fonte = 'autocomplete'` ou `fonte = 'paa'`, `status = 'coletado'`, `created_at` preenchido
- [ ] Rodar o mesmo comando duas vezes seguidas não cria duplicatas
- [ ] Modo `--dry-run` não escreve no banco
- [ ] Modo `--force` ignora o cache de 7 dias
- [ ] Pipeline em lote para `seeds/ideia_chat.json` (10 seeds) completa em menos de 5 minutos
- [ ] Termos normalizados (lowercase, sem acentos extras, trim)
- [ ] Resumo final exibido com totais corretos
- [ ] Falha em um seed do lote não interrompe os demais (continua e reporta no fim)
- [ ] Log estruturado JSON gerado e legível
- [ ] Custo estimado da execução exibido no resumo

## Não-objetivos (out of scope)

- Classificar termos por intenção (será feito em `research/classify-terms`)
- Estimar volume de busca (será feito por outro behavior usando pytrends)
- Coletar SERP (será feito em `research/collect-serp`)
- Raspar conteúdo de concorrentes (será feito em `research/scrape-competitors`)
- Interface web ou dashboard (esta fase é só CLI)
- Notificações automáticas (Slack, email)

## Métricas de sucesso

| Métrica | Alvo |
|---------|------|
| Termos únicos coletados por seed (média) | ≥ 15 |
| Taxa de termos relevantes (validada manualmente em amostra) | ≥ 70% |
| Tempo médio por seed | ≤ 30s |
| Falhas em lote de 10 seeds | ≤ 1 |
| Custo por seed | ≤ R$ 0,30 |

## Riscos / decisões em aberto

1. **Provedor de autocomplete + PAA**: três caminhos possíveis:
   - **Apify actor** específico para Google Autocomplete + PAA (custo por run, ~$0.05-0.10 cada)
   - **Apify actor genérico de Google Search** que retorna SERP completo + PAA (mais caro mas faz duas coisas)
   - **Endpoint não-oficial do Google** (`http://suggestqueries.google.com/...`) — grátis mas frágil e contra ToS
   
   **Decisão recomendada**: começar com **Apify actor específico** para autocomplete (estável, barato), e PAA via Apify SERP scraper (compartilhado com `collect-serp` para reuso). Confirmar nomes exatos dos actors no `/break`.

2. **Cache de 7 dias**: por que 7 dias? Termos do Google mudam pouco no curto prazo. 7 dias balanceia frescor vs custo. Configurável via env var.

3. **Stopwords expandidas**: precisa de lista própria? Vamos usar uma lista genérica de pt-BR + termos vazios específicos do nicho. Lista inicial deve ser commitada antes do `/break`.

4. **Geolocalização**: começamos com Brasil inteiro (geo `BR`). Quando expandir para nichos regionais (ex: contadores em São Paulo), precisa de coleta com geo específico.

5. **Limite de coleta por seed**: 50 default parece razoável; precisa testar se Apify actor entrega esse volume sem custo abusivo.

6. **Persistência da resposta crua**: vale guardar o JSON cru da resposta da API em `data/raw/` para reanálise futura? Decisão para `/plan`: provavelmente sim, em pasta gitignored.
