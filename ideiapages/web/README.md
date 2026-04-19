# IDeiaPages — Web (Next.js)

App Next.js 15 (App Router) que renderiza as páginas geradas pelo IDeiaPages.

## Setup

```bash
cd ideiapages/web
pnpm install   # ou npm install
```

Copiar `.env.example` da raiz de `ideiapages/` para `.env.local` aqui.

## Comandos

```bash
pnpm dev          # dev server em http://localhost:3000
pnpm build        # build de produção
pnpm start        # rodar build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm db:types     # regenera src/lib/database.types.ts a partir do Supabase
```

## Estrutura

```
web/
├── src/
│   ├── app/                 # App Router (apenas pages SEO + route handlers)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (content)/       # rotas de páginas geradas (criadas via /spec rendering/*)
│   │   ├── api/             # route handlers (lead submit, tracking, generation trigger)
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   └── ui/              # shadcn-style (Button, Input, etc)
│   ├── behaviors/           # implementação por behavior (cobertor curto)
│   │   └── <dominio>/<behavior>/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── server/
│   └── lib/
│       ├── supabase/
│       ├── seo/
│       ├── types/
│       ├── database.types.ts
│       └── utils.ts
└── public/
```

## Princípios

- Server Components por padrão. `"use client"` só quando necessário.
- Toda página em `(content)` exporta `generateMetadata`.
- Schema.org via JSON-LD em todas as páginas.
- Validação com Zod em route handlers.
- Sem API key no client (apenas vars `NEXT_PUBLIC_*`).
- Performance budget: LCP < 2.5s, CLS < 0.1, JS < 100kb gzip.
