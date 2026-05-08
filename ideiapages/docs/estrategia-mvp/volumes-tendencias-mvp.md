# Volumes e Tendencias - 10 termos do MVP

Data: 2026-05-08
Fonte: Apify `scrapepilot/google-keyword-finder` (autocomplete PT-BR + estimativa de volume/CPC)
Geo: Brasil · Idioma: Portugues

## Limitacoes metodologicas

- Volumes sao **estimativas baseadas em autocomplete PT-BR**, nao Google Ads Keyword Planner oficial.
- Quando o termo exato nao aparece nos resultados de autocomplete, usamos a variante mais proxima como proxy.
- Google Trends ficou abaixo do threshold de display para todos os 10 termos (esperado para nichos de cauda longa) - tendencia (Stable/Rising/Falling) vem do proprio scrapepilot.
- Mesma keyword retorna volumes ligeiramente diferentes em queries diferentes - **a ordem de grandeza e confiavel; o valor exato e indicativo**.
- Keyword Planner conectando como fonte oficial da proxima atualizacao.

## Tabela consolidada dos 10 termos

| # | Termo | Cluster | Vol/mes | CPC (R$) | Concorrencia | Tendencia | Match |
|---:|---|---|---:|---:|---|---|---|
| 1 | sistema de whatsapp para escritorio contabil | Contabilidade | ~600 | 0,69 | Medium | Stable | variante |
| 2 | atendimento whatsapp escritorio contabil | Contabilidade | ~700 | 2,01 | Medium | Stable | variante |
| 3 | whatsapp para escritorios contabeis | Contabilidade | ~700 | 2,01 | Medium | Stable | variante |
| 4 | sistema de whatsapp para contabilidade | Contabilidade | 100 | 0,81 | Medium | Stable | **exato** |
| 5 | atendimento whatsapp para imobiliarias | Imobiliarias | ~1.600 | 4,65 | Medium | Stable | variante |
| 6 | automacao whatsapp para imobiliarias | Imobiliarias | ~2.300 | 1,36 | Medium | Stable | variante |
| 7 | sistema de atendimento whatsapp | Horizontal | 1.000 | 4,78 | Medium | Stable | **exato** |
| 8 | whatsapp com multiplos atendentes | Horizontal | 2.200 | 3,35 | Medium | Stable | **exato** |
| 9 | como organizar atendimento pelo whatsapp | Dor/Blog | 1.900 | 3,36 | Medium | Stable | **exato** |
| 10 | centralizar atendimento whatsapp | Dor/Blog | 1.600 | 0,98 | Medium | Stable | **exato** |

**Volume total estimado do lote:** ~12.700 buscas/mes
**CPC medio:** R$ 2,40 (sinal comercial moderado-alto)
**Tendencia geral:** Stable em 100% dos termos
**Match exato:** 5 de 10 (50%) | Via variante proxima: 5 de 10 (50%)

## Cluster Contabilidade (4 termos)

Volume estimado somado: ~2.100/mes

Cluster valida-se mais por **SERP nichada** (96% de sinal em 25 resultados) e fit comercial direto do que por volume puro. Termos especificos de nicho tem volume menor mas conversao tipicamente maior.

**Ecossistema relevante (variantes capturadas):**
- `sistema para whatsapp business` - 1.800/mes - CPC 3,43
- `sistema de atendimento whatsapp para empresas` - 1.600/mes - CPC 2,85 (Rising em uma seed)
- `mais de uma conta whatsapp business` - 1.600/mes - CPC 3,09 - **Rising**
- `whatsapp para escritorio de contabilidade` - 400-700/mes - CPC 2,01-4,73
- `sistemas de atendimento whatsapp` - 1.500/mes - CPC 4,53
- `grupo de whatsapp de contabilidade` - 1.100/mes - CPC 4,78 (intent diferente)
- `sistema de whatsapp para escritorio de contabilidade` - 600/mes - CPC 0,69
- `sistema de whatsapp para empresas` - 600/mes - CPC 2,50

## Cluster Imobiliarias (2 termos)

Volume estimado somado das variantes mais proximas: ~3.900/mes

Mercado tem **volume forte no ecossistema** mesmo com termos exatos da seed nao retornando match direto - o que indica busca em PT-BR mais natural com variacoes.

**Ecossistema relevante:**
- `app para automacao whatsapp` - 2.400/mes - CPC 2,81
- `automacao no whatsapp business` - 2.400/mes - CPC 3,44
- `whatsapp aluguel de imoveis` - 2.000-2.400/mes - CPC 1,17-4,66 (intent direto imobiliario)
- `automacao para whatsapp gratis` - 2.300/mes - CPC 3,63
- `automacao whatsapp para empresas` - 2.300/mes - CPC 1,36
- `automacao de whatsapp gratis` - 2.200/mes - CPC 2,50
- `ia para atendimento whatsapp` - 2.100/mes - CPC 2,11
- `atendimento pelo whatsapp empresa` - 2.000/mes - CPC 4,00
- `automacao de atendimento whatsapp` - 2.100/mes - CPC 4,73 (CPC alto = comercial quente)
- `sistema de automacao whatsapp` - 2.100/mes - CPC 2,71
- `plataforma de atendimento whatsapp` - 1.600-2.000/mes
- `automacao whatsapp com ia` - 1.100/mes - CPC 4,30 (subangulo IA emergente)
- `grupo de whatsapp corretores de imoveis` - 900/mes - CPC 3,97

## Cluster Horizontal + Dor (4 termos)

Volume principal somado: ~6.700/mes - **maior volume agregado do lote**

Termos exatos do lote conferem com **CPC alto** (R$ 3-5), confirmando intent comercial.

**Top variantes captadas:**
- `whatsapp com varios atendentes` - 2.500/mes - CPC 4,96
- `whatsapp com multiplos atendentes` - 2.200/mes - CPC 3,35 *(seed exato)*
- `whatsapp business varios atendentes` - 2.100/mes - CPC 2,43
- `colocar atendentes no whatsapp` - 2.100/mes - CPC 3,51
- `plataforma para atendimento whatsapp` - 2.100/mes - CPC 4,48
- `whatsapp para varios atendentes` - 2.000/mes - CPC 3,18
- `plataforma de atendimento de whatsapp` - 2.000/mes - CPC 4,70
- `multiatendimento whatsapp como funciona` - 2.000/mes - CPC 2,54
- `como organizar atendimento pelo whatsapp` - 1.900/mes - CPC 3,36 *(seed exato)*
- `sistema de whatsapp business` - 1.900/mes - CPC 1,56
- `whatsapp business multiplos atendentes` - 1.900/mes - CPC 2,23
- `whatsapp varios atendentes gratis` - 1.700/mes - CPC 1,20
- `multiatendimento whatsapp para empresas` - 1.700/mes - CPC 3,35
- `sistema multi atendimento whatsapp` - 1.700/mes - CPC 4,62
- `centralizar atendimento whatsapp` - 1.600/mes - CPC 0,98 *(seed exato)*
- `sistema de atendimento whatsapp gratis` - 1.600/mes - CPC 2,75
- `sistema de multi atendimento whatsapp` - 1.600/mes - CPC 2,66
- `multi atendimento whatsapp gratis` - 1.500/mes - CPC 2,16
- `sistema de atendimento whatsapp white label` - 1.400/mes - CPC 2,58
- `atendimento whatsapp varios atendentes` - 1.400/mes - CPC 1,50

## Sinais Rising no ecossistema (oportunidades futuras)

Variantes que aparecem como tendencia ascendente e podem virar candidatos a proximo lote:

- `mais de uma conta whatsapp business` - 1.600/mes
- `como sair da conta whatsapp business` - 300-1.400/mes (variavel)
- `falar com atendente caixa whatsapp` - 600/mes
- `whatsapp business mais de um atendente` - 1.100/mes

## Subangulos emergentes detectados

Temas que aparecem com forca nas variantes e podem virar paginas futuras:

1. **IA para WhatsApp** - varios termos com volume 1.100-2.100/mes (`ia para atendimento whatsapp`, `automacao whatsapp com ia`, `sistema de atendimento whatsapp com ia`, `sistema de whatsapp com ia`)
2. **Multi-conta WhatsApp Business** - busca em alta para gerenciar varias contas
3. **Plataforma vs Sistema** - usuarios usam os dois termos quase intercambiaveis (boa oportunidade de pegar ambos)
4. **WhatsApp + CRM** - 600/mes em `sistema de whatsapp com crm`
5. **White label** - 1.400/mes em `sistema de atendimento whatsapp white label` (oportunidade B2B/agencia)

## Como esses dados entram no deck

- **Slide 6 (Contabilidade)** - tabela com volume + CPC + tendencia dos 4 termos contabeis, painel de ecossistema com top 5 variantes
- **Slide 7 (Imobiliarias)** - tabela com volume + CPC + tendencia dos 2 termos imobiliarios, painel de ecossistema com top 5 variantes
- **Slide 9 (As 10 paginas)** - coluna adicional com volume estimado por LP
- **Anexo C** - nota metodologica atualizada (volume Apify + tendencia Apify; Keyword Planner como proxima fonte oficial)
