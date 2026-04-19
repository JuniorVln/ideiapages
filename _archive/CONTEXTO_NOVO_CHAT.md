> ⚠️ **DOCUMENTO DESATUALIZADO — ARQUIVADO EM 2026-04-16**
>
> Este arquivo representa a **v1** do projeto (foco em volume — 5.000 páginas, DataForSEO, nicho de certificado digital por cidade, Fase 1 manual com 50 LPs).
>
> A **versão vigente (v2)** está em:
> - `_docs/PLANEJAMENTO_IDEIAPAGES_v2.md` — fonte canônica do projeto
> - `_docs/PROPOSTA_IDEIAPAGES_v2.md` — proposta comercial
> - `ideiapages/` — implementação SDD
> - `ideiapages/references/product_facts.md` — fatos do produto Ideia Chat
>
> **Diferenças principais entre v1 e v2:**
> - v1 era genérico para múltiplos clientes; v2 foca no MVP **Ideia Chat** (`ideiamultichat.com.br`)
> - v1 usava DataForSEO; v2 usa **Apify + Firecrawl + pytrends** (sem DataForSEO)
> - v1 falava em WordPress/Next.js; v2 é **Next.js + proxy reverso** (sem WordPress)
> - v1 priorizava volume; v2 prioriza **conversão** (20 páginas que convertem > 1.000 que não)
> - v1 não tinha metodologia de desenvolvimento; v2 adota **Spec-Driven Development**
>
> Mantido apenas como histórico de evolução do pensamento estratégico. **Não usar como referência técnica.**

---

# Contexto Completo: Projeto de SEO Programático - Rede Ideia

## 1. Visão Geral do Projeto
Estamos desenvolvendo um projeto estratégico e avançado de **SEO Programático** para a Rede Ideia. A apresentação (Pitch Deck) que construímos serve para vender essa solução. Nossa arquitetura foge completamente do modelo saturado de "gerador de textos fracos" (thin content) e foca em ser um **Injetor de Dados Estruturados**, alavancando **Information Gain, E-E-A-T**, e alta conversão através de **Testes A/B nativos**.

---

## 2. O Modelo de Negócio e Diferenciação Estratégica
Para que as 5.000 páginas não sejam apenas métricas de vaidade ("vanity metrics"), definimos pilares fundamentais de negócios:
1. **ICP e Monetização:** O projeto exige a definição clara no novo chat do cliente ideal (SaaS? Agência? Produto Próprio?) e como a geração massiva gera dinheiro (Modelo de Performance por Lead, Mensalidade SaaS, etc).
2. **Métricas de Sucesso e ROI (CRM):** O foco principal é rastrear o funil completo: *Keyword -> Tráfego -> Lipead -> Cliente -> LTV*. O sistema não para na aquisição de tráfego.
3. **Diferencial Competitivo ("Por que nós? Por que agora?"):** Diferente de ferramentas como RankMath ou SurferSEO, nós injetamos dados que trazem real utilidade: depoimentos reais, mapas, informações factuais de prefeituras/IBGE (UGC/Social proof dinâmico regionalizado). Além disso, aplicamos **Conteúdo Dinâmico por Intenção** (a mesma URL adapta sua copy com base na intenção de busca detectada da query) e **Programmatic Internal Linking** para escalar autoridade automaticamente.

---

## 3. A Infraestrutura e Execução Técnica
A estrutura técnica resolve as falhas clássicas do SEO automatizado garantindo alta performance e controle técnico:
1. **Infra de Publicação Nativa:** Uso de **Next.js** hospedado estaticamente/Edge na **Vercel**. Velocidade extrema de carregamento e perfeito controle técnico de indexabilidade e schema.
2. **Fim do "Thin Content" (Quality Gates):** O módulo de IA não cospe HTML final; usamos templates no Front-end com blocos de layout. O LLM atua sob rigorosos *scores de qualidade* e só aprova a injeção do texto se este passar no nosso bloqueio de thin content.
3. **Fontes de Dados de SEO Concretas:** Abandono da premissa vaga de "varrer fontes" para o uso pragmático de APIs precisas (DataForSEO, Google Ads API).
4. **Máquina de Autocura com Testes A/B:** Monitoramento com periodicidade realista (diária/semanal, já que APIs de rankeamento têm delay). Esse loop aciona Testes A/B no nível do Front-end: alteração automatizada de Copy, Schemas e CTAs visando conversão.

---

## 4. O Plano de Validação Incremental (O Roteiro)
A construção do software e estratégia não será um "big bang" irresponsável. O desenvolvimento e entrega obedecerão a fases incrementais focadas em provar retorno rápido, seguindo o roteiro MVP:
* **Fase 1 (Conversão Manual):** Lançar apenas 50 keywords via 50 Landing Pages manualmente estruturadas para provar o "unit economics" da conversão daquele nicho.
* **Fase 2 (Automatizar Descoberta):** Integrar o módulo de DataForSEO/Apify. Validar a qualidade semântica da massa bruta das palavras-chave geradas antes de gerar qualquer texto.
* **Fase 3 (Automatizar Produção do Conteúdo):** Integrar Agentes (Claude JSON Output) para injetar o conteúdo nos bancos de dados, ativando as `dynamic pages` do Next.js em massa. Avaliar performance do render (Vercel) e Quality Gates.
* **Fase 4 (Monitoramento e Otimização A/B):** Fechar o ciclo integrando ferramentas CRMs e lógicas de variação de layout de interface caso não tenha conversão.

---

## 5. O Estado Atual do "Pitch Deck" (A Aplicação Atual de Vendas)
A apresentação (slides interativos) utilizada para angariar o orçamento/parceria **já foi construída em formato Dashboard Web**.
* **Caminho Local:** `c:\Users\junio\Projects\Rede Ideia\SEO-Apresentacao\`
* **Stack da Apresentação:** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion. 
* **Estética:** *UX/UI Pro Max*. Fundo dark mode, Glassmorphism, grid dots, diagramas técnicos e animações state-of-the-art.

---

## 6. O Arsenal & Ferramentas (Stack Tecnológica Padrão)
* **LLMs (Lógica e Revisão):** Claude Code. Será responsável por gerar JSONb e atuar como *Quality Gate*.
* **Extração & Raspagem:** Apify (Descoberta e extração de UGC Local), Firecrawl (Scraper inteligente).
* **Métricas de Busca:** DataForSEO API.
* **Banco de Dados (BaaS):** Supabase (Tabelas Relacionais geradas para LPs e Postgres + pgvector).
* **Front-end Escalável:** Next.js (App Router, hospedado na **Vercel**).

---

## 7. Próximos Passos Imediatos (Direcionamento deste Chat)
Ao iniciar seu novo chat, declare ao LLM qual caminho deseja seguir agora:
1. **Planejamento Tático (Produto E Negócios):** Responder as "Lacunas Estratégicas". Trabalharmos na definição final de ICP, modelo de monetização, e a escolha do primeiro nicho piloto paras as 50 URLs da "Fase 1".
2. **Setup Arquitetural do Produto (Vibe Coding):** Iniciar a estruturação do repositório final do Next.js do gerador e/ou as tabelas e RPCs dentro do Supabase.
3. **Módulo de Pesquisa e Extração:** Criar e testar os scripts no Apify e a integração via DataForSEO para iniciar o mapeamento.
4. **Deploy do Pitch Deck:** Subir o `SEO-Apresentacao` no Github e providenciar o Deploy na Vercel para apresentar ao cliente de forma profissional.
