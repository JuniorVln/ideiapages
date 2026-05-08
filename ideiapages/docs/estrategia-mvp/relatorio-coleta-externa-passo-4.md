# Relatorio de Coleta Externa - Passo 4

Data: 2026-05-07

## Objetivo

Validar os primeiros termos da matriz com busca externa real, observando SERP, concorrentes recorrentes, tipo de resultado e sinais iniciais de oportunidade.

Este passo ainda nao fecha decisao final de paginas. Ele cria a primeira camada de evidencia externa para responder a pergunta do Victor: estamos escolhendo nichos e termos por pesquisa real ou por intuicao?

## Metodo usado nesta primeira coleta

- Ferramenta: Firecrawl CLI.
- Fonte: busca web.
- Pais: BR.
- Limite: top 5 resultados por termo.
- Lote principal: 20 termos prioridade A da matriz.
- Lote de correcao: 5 variacoes brasileiras/accentuadas de contabilidade.

## Arquivos gerados

| Arquivo | Uso |
|---|---|
| `pesquisa-serp-amostra-001.csv` | SERP normalizada do primeiro lote, uma linha por resultado |
| `pesquisa-serp-contabilidade-correcao-acentos.csv` | SERP normalizada das variacoes brasileiras/accentuadas de contabilidade |
| `pesquisa-termos-enriquecimento.csv` | Planilha-base para enriquecer todos os termos com volume, CPC, SERP, concorrentes e recomendacao |
| `.firecrawl/ideiapages-serp/*.json` | JSONs brutos da coleta Firecrawl |

## Escopo da amostra

Foram coletados:

- 20 termos do primeiro lote.
- 100 resultados normalizados no lote principal.
- 5 termos adicionais de correcao em contabilidade.
- 25 resultados normalizados no lote de correcao.

Distribuicao do lote principal:

- 12 termos horizontais.
- 8 termos de contabilidade.

## Primeiros sinais - termos horizontais

Nos termos horizontais, a SERP ja mostra um mercado ativo de plataformas de atendimento, multiatendimento, CRM e WhatsApp para empresas.

Concorrentes recorrentes no lote horizontal:

| Dominio | Aparicoes |
|---|---:|
| underchat.com.br | 6 |
| letalk.com.br | 6 |
| chatpro.com.br | 5 |
| totalchat.com.br | 4 |
| youtube.com | 4 |
| blip.ai | 2 |
| clientify.com | 2 |
| multiatendente.com | 2 |
| kommo.com | 2 |

Exemplos de resultados encontrados:

- `sistema de atendimento whatsapp`: ChatPro, UnderChat, Total Chat, ZapSAC e Letalk.
- `plataforma de atendimento whatsapp`: ChatPro, UnderChat, Letalk, Total Chat e SleekFlow.
- `whatsapp com multiplos atendentes`: WhatsApp Help Center, Total Chat, UnderChat, Multiatendente e Whats Company.
- `multiatendimento whatsapp`: Multi Atendimento, UnderChat, Total Chat, Multiatendente e WhatsHelp.
- `gestao de atendimento whatsapp`: ChatPro e Blip aparecem nos primeiros resultados.
- `controle de atendimento whatsapp`: ChatPro e UnderChat aparecem nos primeiros resultados.

### Leitura inicial

Os termos horizontais parecem ter alta intencao comercial, mas tambem concorrencia forte. Eles devem existir no MVP, mas talvez nao sejam o melhor caminho isolado para vitoria rapida.

Boa direcao para MVP:

- criar uma pagina horizontal forte para `sistema de atendimento whatsapp`;
- criar uma pagina ou secao focada em `whatsapp com multiplos atendentes`;
- usar termos de dor como `centralizar atendimento whatsapp`, `organizar atendimento whatsapp`, `gestao de atendimento whatsapp` e `controle de atendimento whatsapp` para blog e links internos.

## Primeiros sinais - contabilidade

A coleta confirma que contabilidade tem sinais reais, mas os termos precisam ser escolhidos com cuidado.

### Termos que trouxeram concorrentes nichados

As variacoes mais brasileiras/accentuadas trouxeram resultados mais alinhados:

| Termo | Sinais encontrados |
|---|---|
| `sistema de whatsapp para escritório contábil` | Whats Contabil, Zappy Contabil, Integgri, Zap Contabil, Nibo |
| `whatsapp para escritórios contábeis` | Zap Contabil, Integgri, Nibo, Zappy Contabil, SocialHub |
| `whatsapp para contadores brasil` | Whats Contabil, Nibo, Zap Contabil, Confi, Contabeis |
| `atendimento whatsapp escritório contábil` | Whats Contabil, Zappy Contabil, Nibo, Superdrive Contabil, Integgri |

### Termos com ruido

Alguns termos sem acento ou muito genericos trouxeram resultados em espanhol, redes sociais ou softwares contabeis amplos:

| Termo | Problema observado |
|---|---|
| `whatsapp para contadores` | Resultados em espanhol, Facebook, TikTok e conteudos nao transacionais |
| `whatsapp para escritorio contabil` | Resultado oficial do WhatsApp Desktop e conteudos em espanhol |
| `sistema de atendimento para contabilidade` | Mistura sistemas contabeis/ERP com software de atendimento |

### Leitura inicial

Contabilidade nao deve ser descartada. Pelo contrario: com as variacoes corretas, aparecem concorrentes nichados e conteudos diretamente ligados a atendimento via WhatsApp para escritorios contabeis.

A hipotese mais forte nao e simplesmente `whatsapp para contadores`. A formula mais promissora parece ser:

- `sistema de whatsapp para escritório contábil`;
- `whatsapp para escritórios contábeis`;
- `atendimento whatsapp escritório contábil`;
- `sistema de atendimento whatsapp para contabilidade`;
- `gestão de whatsapp para contadores`;
- `whatsapp contábil`.

## Concorrentes e dominios que entraram no radar

### Horizontais

- ChatPro: https://www.chatpro.com.br/
- UnderChat: https://underchat.com.br/
- Total Chat: https://www.totalchat.com.br/
- ZapSAC: https://zapsac.com/
- Letalk: https://letalk.com.br/
- Blip: https://www.blip.ai/
- Kommo: https://www.kommo.com/
- Clientify: https://clientify.com/

### Contabilidade

- Zap Contabil: https://zapcontabil.com/
- Zappy Contabil: https://zappycontabil.com.br/
- Whats Contabil: https://whatscontabil.com/
- Integgri: https://www.integgri.com.br/sistema-whatsapp-para-contatbilidade/
- Nibo: https://www.nibo.com.br/blog/whatsapp-contabil-atendimento-profissional
- Maxbot: https://www.maxbot.com.br/plataforma-de-atendimento-digital-2/plataforma-de-atendimento-para-escritorio-de-contabilidade
- SocialHub: https://www.socialhub.pro/blog/whatsapp-para-contabilidade/

Observacao: apareceram `zapcontabil.com` e `zappycontabil.com.br`. E importante validar com Abimael/Victor qual deles e o concorrente citado como "Zap Contabil" e se ambos devem entrar no radar.

## Resposta provisoria para a pergunta do Victor

Com a primeira coleta, a resposta honesta seria:

> Ainda nao temos volume fechado, mas ja ha evidencias de que contabilidade tem demanda validada quando usamos termos brasileiros mais especificos, como "sistema de whatsapp para escritorio contabil" e "whatsapp para escritorios contabeis". Tambem existe uma demanda horizontal forte por atendimento WhatsApp, multiatendimento e CRM para WhatsApp, mas essa SERP parece mais competitiva. Portanto, contabilidade deve continuar como hipotese prioritaria, mas nao como unica frente.

## Limites desta coleta

Esta amostra ainda nao inclui:

- volume de busca;
- CPC;
- sazonalidade;
- dados do Search Console;
- dados do Keyword Planner;
- autoridade de dominio;
- scraping completo das paginas concorrentes;
- top 10 completo para todos os 150 termos;
- coleta dos demais nichos de prioridade A, como clinicas, odontologia e imobiliarias.

## Proximas coletas recomendadas

1. Rodar Firecrawl/Apify para todos os termos prioridade A.
2. Incluir termos accentuados e variacoes brasileiras nos termos de contabilidade.
3. Coletar SERP de clinicas, odontologia e imobiliarias.
4. Raspar as paginas principais de concorrentes recorrentes para extrair promessa, dores, CTAs, FAQs e estrutura.
5. Enriquecer a planilha com volume e CPC via Keyword Planner ou outra fonte.
6. Cruzar tudo com Search Console assim que o acesso estiver disponivel.

## Decisoes preliminares para os proximos passos

1. Manter contabilidade como prioridade A, mas ajustar a linguagem dos termos.
2. Separar `sistema de atendimento para contabilidade` de `sistema de whatsapp para escritorio contabil`, porque o primeiro mistura ERP/sistema contabil e o segundo parece mais alinhado ao Ideia Multi Chat.
3. Incluir concorrentes horizontais alem de DigiSac, porque a SERP trouxe ChatPro, UnderChat, Total Chat, ZapSAC e Letalk com forca.
4. Tratar termos de dor como apoio de blog, especialmente centralizacao, organizacao, gestao e controle de atendimento no WhatsApp.
