# Architecture — IDeiaPages

> Lido por todo agente antes de gerar código. Definição de stack, layout e regras invioláveis.

---

## Stack


| Camada             | Tecnologia                         | Versão alvo             |
| ------------------ | ---------------------------------- | ----------------------- |
| Frontend           | Next.js (App Router)               | 15.x                    |
| Linguagem (web)    | TypeScript                         | 5.x (strict)            |
| Estilo             | Tailwind CSS                       | 4.x                     |
| UI Primitives      | shadcn/ui (Radix)                  | latest                  |
| Backend (web)      | Next.js Route Handlers             | runtime: nodejs ou edge |
| Banco              | Supabase PostgreSQL                | latest                  |
| ORM                | Supabase JS Client + tipos gerados | `@supabase/supabase-js` |
| Hosting            | Vercel                             | Free → Pro              |
| Tools de pesquisa  | Python                             | 3.11+                   |
| Gerenciador Python | uv                                 | latest                  |
| LLMs               | Claude, GPT, Gemini                | mais recente disponível |


---

## Monorepo Layout

```
ideiapages/
├── .cursor/              SDD: commands, agents, rules
├── references/           Knowledge base (este arquivo está aqui)
├── behaviors/            Specs e issues por comportamento
├── research/             Python (collectors + analyzers)
├── web/                  Next.js app
├── supabase/             Migrations SQL + RLS
├── seeds/                Termos-semente por nicho
└── docs/                 Documentação técnica
```

---

## Regra invioláveis

### 1. Thin Client / Fat Server

- **NUNCA** colocar API keys no client (Next.js).
- Variáveis com prefixo `NEXT_PUBLIC_`* são públicas — usar APENAS para dados que podem vazar (URL Supabase, anon key, GA4 ID, número de WhatsApp).
- Variáveis sensíveis (Anthropic, OpenAI, Google AI, Apify, Firecrawl, Supabase service_role) ficam APENAS em route handlers / scripts Python.
- Toda chamada a LLM/Apify/Firecrawl acontece no server.

### 2. Behavior Isolation (cobertor curto)

- Toda feature mora em `behaviors/<dominio>/<comportamento>/`.
- Código de implementação fica em `web/src/behaviors/<dominio>/<comportamento>/` (web) ou `research/src/ideiapages_research/behaviors/<comportamento>/` (Python).
- Um behavior NÃO importa código de outro behavior diretamente. Comunicação acontece via:
  - Tipos compartilhados em `web/src/lib/types/` ou `research/src/ideiapages_research/types/`
  - Eventos / contratos via Supabase
  - APIs HTTP entre route handlers

### 3. Server Components por padrão

- No Next.js, componentes são **Server Components** salvo quando explicitamente precisam de interatividade.
- Adicionar `"use client"` só quando necessário (form, modal, hook de estado).
- Evitar lógica de negócio em client components.

### 4. Tipos gerados, não escritos à mão

- Tipos do banco vêm de `supabase gen types typescript` em `web/src/lib/database.types.ts`.
- Nunca escrever tipos de tabela manualmente.

### 5. Sem código morto

- Se um behavior é deletado, sua pasta inteira em `behaviors/` e `web/src/behaviors/` (ou `research/src/.../behaviors/`) sai junto.
- Sem "comentar para depois". Use git history.

### 6. Comentários

- Comentar apenas **intenção não óbvia** ou **trade-offs**.
- NUNCA comentar narrando o que o código faz.

---

## Boundaries

```mermaid
flowchart LR
  subgraph client [Client - Public]
    react[React Components]
    forms[Forms / Modals]
    analytics[GA4 ping]
  end

  subgraph server [Server - Private]
    routes[Route Handlers /api/*]
    rsc[Server Components]
    middleware[Middleware A/B]
  end

  subgraph external [External APIs]
    supabase[(Supabase)]
    apify[Apify]
    firecrawl[Firecrawl]
    llms[Claude / GPT / Gemini]
  end

  client -->|"fetch /api/*"| routes
  client -->|"render"| rsc
  routes --> supabase
  routes --> llms
  routes --> apify
  routes --> firecrawl
  rsc --> supabase

  client -.x.-|"NUNCA"| llms
  client -.x.-|"NUNCA"| apify
```



---

## Versionamento

- Branches: `main` (produção), `dev` (integração), `feat/<behavior-name>`, `fix/<issue-id>`.
- Commits: convencionais (`feat:`, `fix:`, `chore:`, `docs:`).
- PRs: descrição obrigatória com link para a issue do behavior.

---

## Performance budgets (alvo)


| Métrica              | Alvo                                       |
| -------------------- | ------------------------------------------ |
| LCP (mobile)         | < 2.5s                                     |
| CLS                  | < 0.1                                      |
| INP                  | < 200ms                                    |
| Bundle JS por página | < 100kb gzip                               |
| Imagens              | sempre via `next/image`, formato AVIF/WebP |


