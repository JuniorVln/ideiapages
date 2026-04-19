# IDeiaPages

> Plataforma de Geração de Páginas Otimizadas para SEO e Conversão.

Sistema genérico de SEO programático aplicado ao MVP **Ideia Chat** ([ideiamultichat.com.br](https://ideiamultichat.com.br/)). Reduz CAC via tráfego orgânico altamente segmentado, com pesquisa profunda de termos, geração de conteúdo multi-IA, testes A/B nativos e autocura.

---

## Documentos

- [Planejamento v2](../PLANEJAMENTO_IDEIAPAGES_v2.md)
- [Proposta v2](../PROPOSTA_IDEIAPAGES_v2.md)
- [Custos](../custos.md)
- [SDD Workflow](docs/sdd-workflow.md)

---

## Arquitetura — Spec-Driven Development (SDD)

O projeto segue **Behavior-Oriented Architecture**: cada feature é um comportamento isolado em `behaviors/<dominio>/<comportamento>/`. Isso impede que mudar uma feature quebre outra (cobertor curto resolvido).

### Domínios de behavior


| Domínio       | Responsabilidade                                          |
| ------------- | --------------------------------------------------------- |
| `research`    | Coleta e análise de termos de busca                       |
| `generation`  | Geração de conteúdo com Claude/GPT/Gemini + Quality Gate  |
| `rendering`   | Renderização das páginas (blog, landing, comparison, FAQ) |
| `conversion`  | Captura de leads (form, WhatsApp modal, UTM tracking)     |
| `experiments` | Teste A/B (assignment, métricas, vencedor)                |
| `monitoring`  | Autocura, detecção de quedas, escala por conversão        |


### Pipeline SDD

```
/spec <behavior>   →  Single Source of Truth (markdown)
/break <behavior>  →  Issues sequenciais (frontend antes de DB)
/plan <issue>      →  RAG + arquivos exatos a tocar
/execute <issue>   →  Agente especialista executa cirurgicamente
```

Veja [docs/sdd-workflow.md](docs/sdd-workflow.md) para detalhes.

---

## Estrutura

```
ideiapages/
├── .cursor/
│   ├── commands/         Slash commands SDD
│   ├── agents/           7 agentes especialistas
│   └── rules/            Regras globais (sempre ler references)
├── references/           Knowledge base (lida por todo agente)
├── behaviors/            Specs por comportamento
├── research/             Tools Python (Apify, Firecrawl, pytrends, LLM)
├── web/                  App Next.js (App Router)
├── supabase/             Migrations SQL + RLS policies
└── docs/                 Documentação técnica
```

---

## Stack


| Camada    | Ferramenta                                        |
| --------- | ------------------------------------------------- |
| Frontend  | Next.js 15 (App Router) + TypeScript + Tailwind   |
| Backend   | Next.js Route Handlers + Supabase                 |
| Banco     | Supabase (PostgreSQL) com RLS                     |
| Hosting   | Vercel (Edge + ISR)                               |
| Pesquisa  | Apify, Firecrawl, pytrends                        |
| LLMs      | Claude (Anthropic), GPT (OpenAI), Gemini (Google) |
| Analytics | GA4 + Search Console                              |
| Tools     | Python 3.11+ (collectors/analyzers), uv para deps |


---

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (ou npm)
- Python 3.11+
- uv (ou pip)
- Conta Supabase ativa
- API keys: Apify, Firecrawl, Anthropic, OpenAI, Google AI

Veja `.env.example` para todas as variáveis necessárias.

---

## Como começar

1. **Bootstrap (Fase -1)** — já feito (este repo)
2. **Configurar credenciais** — copiar `.env.example` para `.env` e preencher
3. **Criar tabelas no Supabase** — rodar migrations em `supabase/migrations/`
4. **Pesquisa (Fase 0)** — `cd research && uv sync && uv run ideiapages-research collect --seed-file ../seeds/ideia_chat.json`
5. **App web (Fase 1+)** — `cd web && pnpm install && pnpm dev`

---

## Roadmap

- **Fase -1** — Bootstrap SDD (atual)
- **Fase 0** — Módulo de pesquisa e descoberta
- **Fase 1** — Páginas piloto (5-10) com captura de leads
- **Fase 2** — Geração multi-IA + Teste A/B
- **Fase 3** — Dashboard de inteligência
- **Fase 4** — Autocura + Escala contínua

---

## Princípios

1. **Conversão > Volume** — 20 páginas que convertem valem mais que 1.000 que não.
2. **Dados > Achismo** — Toda decisão de conteúdo vem de pesquisa real.
3. **Estratégia > Tecnologia** — Tech é meio. Inteligência de marketing é o diferencial.
4. **Cobertor curto resolvido** — Cada behavior é isolado. Mudar X não quebra Y.
5. **Thin Client / Fat Server** — API keys e regras de negócio nunca no frontend.

