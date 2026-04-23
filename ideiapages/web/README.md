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

## Supabase (Fase 1)

Migrations do domínio web ficam em `ideiapages/supabase/migrations/`:

- `0007_paginas` … `0010_metricas_diarias` — tabelas `paginas`, `variacoes`, `leads`, `metricas_diarias`
- `0011_fase1_web_hardening` — remove índice inválido em `leads`, garante trigger de dedup (5 min) e restringe leitura pública de `variacoes` / `metricas_diarias` a páginas com `status = 'publicado'`

Após `supabase db push` (ou aplicar SQL no projeto), rode `pnpm db:types` nesta pasta.

## Google Search Console (pós-deploy)

1. Em [Google Search Console](https://search.google.com/search-console), adicione a propriedade de URL prefix (`https://ideiamultichat.com.br` ou o domínio que apontar para este app).
2. Verifique a propriedade (DNS, arquivo HTML ou tag meta, conforme a opção escolhida).
3. Em **Sitemaps**, envie `https://<seu-dominio>/sitemap.xml`.
4. Após indexação inicial: **Rich Results Test** em pelo menos uma URL `/blog/<slug>` com FAQ.
5. **PageSpeed / Web Vitals** (mobile) para LCP e CLS conforme spec Fase 1.

Eventos GA4 usados no cliente (ver `src/lib/analytics.ts`): `form_start`, `form_abandon`, `lead_submit`, `whatsapp_open`, `whatsapp_redirect`.

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
│   │   └── ui/              # Design system Fase 1: Button, Input, Label, FormField, LeadForm, WhatsAppModal, PageCTA, FloatingCTA, StickyHeader, SchemaOrg
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
