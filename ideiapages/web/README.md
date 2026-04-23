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
pnpm compose-page -- --list-pronto
pnpm compose-page -- --termo-id <uuid> [--publish] [--dry-run]
pnpm generate-page -- --termo-id <uuid> [--providers claude,gpt,gemini] [--activate] [--replace-llm] [--dry-run]
pnpm declare-winner -- [--apply] [--min-per-arm 30]
```

## Deploy na Vercel (Fase 1 — piloto)

1. **Repositório**: conecte o GitHub ao Vercel e defina **Root Directory** = `ideiapages/web` (se o repo for a pasta `ideiapages`; se o mono for `Rede Ideia`, use `ideiapages/web`).
2. **Framework**: Next.js (auto). O arquivo `vercel.json` fixa `pnpm install` + `pnpm run build`.
3. **Variáveis de ambiente** (Production + Preview), espelhando `ideiapages/.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (somente servidor — necessário para `POST /api/leads`)
   - `NEXT_PUBLIC_SITE_URL` — URL pública final (ex.: `https://ideiamultichat.com.br` ou o domínio `.vercel.app` até o proxy)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — só dígitos, ex. `5511999999999`
   - `NEXT_PUBLIC_GA4_ID` ou `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
   - **`NEXT_PUBLIC_ENV=production`** em **Production** (ativa GA4 e `robots` liberando crawl). Em Preview use outro valor para manter `robots` bloqueado.
4. **Domínio em `/blog` no site principal**: faça o proxy reverso do host principal para este projeto **preservando o path** `/blog` e `/blog/*` (ex.: Nginx `location /blog/` → upstream Vercel com URI intacta; ou Cloudflare Workers / rewrite equivalente). O app já expõe rotas em `/blog` e `/blog/[slug]`.
5. **Pós-deploy**: enviar `https://<domínio>/sitemap.xml` no GSC (ver seção GSC acima); testar um lead real e o evento `lead_submit` no GA4 DebugView.

### Publicar páginas piloto (Supabase)

A partir da pasta `ideiapages/web` (com `.env` em `ideiapages/.env` contendo `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

```bash
pnpm compose-page -- --list-pronto
pnpm compose-page -- --termo-id <uuid> --publish
```

Repita para 5–10 termos com `briefing_pronto`. Evite slug duplicado (o script avisa se já existir).

## Supabase (Fase 1)

Migrations do domínio web ficam em `ideiapages/supabase/migrations/`:

- `0007_paginas` … `0010_metricas_diarias` — tabelas `paginas`, `variacoes`, `leads`, `metricas_diarias`
- `0011_fase1_web_hardening` — remove índice inválido em `leads`, garante trigger de dedup (5 min) e restringe leitura pública de `variacoes` / `metricas_diarias` a páginas com `status = 'publicado'`
- **`0012_fase2_experiments`** — colunas `provider` / custo / tokens em `variacoes`; `status_experimento` e `variacao_vencedora_id` em `paginas`; tabela `experimentos`; `metricas_diarias.variacao_id` + índices únicos parciais (rollup vs braço)

Após `supabase db push` (ou aplicar SQL no projeto), rode `pnpm db:types` nesta pasta.

## Fase 2 — Multi-IA + A/B (app)

1. **Env**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` (ou `GEMINI_API_KEY`). Opcional: `CLAUDE_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL`.
2. **Fluxo**: criar página com `compose-page` → gerar braços com `pnpm generate-page -- --termo-id …` → opcional `--activate` para `status_experimento=ativo` e linha em `experimentos`.
3. **Runtime**: `middleware.ts` grava `ideia_vid` e `ideia_ab_<paginaId>`; `/blog/[slug]` renderiza `corpo_mdx` do braço; `ExposureTracker` chama `POST /api/metrics/exposure` (service role no servidor).
4. **Vencedor**: `pnpm declare-winner --` (relatório) ou `--apply` se χ² indicar diferença significativa e `--min-per-arm` atingido.

Prompts versionados: `ideiapages/references/prompts/generate-page.*.md`.

## Fase 3 — Dashboard interno (`/admin`)

1. **Env**: `ADMIN_ALLOWED_EMAILS` (lista separada por vírgula, minúsculas recomendadas).
2. **Supabase Auth**: habilitar **Magic Link** (email) no projeto; URL de redirect permitida deve incluir `https://<seu-dominio>/auth/callback`.
3. **Rotas**: `/admin/login` → link mágico → `/auth/callback` → `/admin/dashboard`; também `/admin/pages`, `/admin/recommendations`, `/admin/costs`.

O middleware exige sessão + e-mail na allowlist para tudo sob `/admin` exceto `/admin/login`.

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
