# Break — Fase 1: Páginas Piloto

> Decomposição da spec em 22 issues distribuídas pelos domínios `data-model`, `rendering`, `conversion`, `monitoring` e `generation`.
> Spec original: [`specs/fase-1-paginas-piloto.md`](./fase-1-paginas-piloto.md)

---

## DAG de execução

| #  | Issue | Domínio | depends_on | est. min |
|----|-------|---------|------------|----------|
| 1  | data-model/07-paginas | web/data-model | [] | 30 |
| 2  | data-model/08-variacoes | web/data-model | [07] | 20 |
| 3  | data-model/09-leads | web/data-model | [08] | 25 |
| 4  | data-model/10-metricas-diarias | web/data-model | [09] | 20 |
| 5  | data-model/types-update | web/data-model | [10] | 20 |
| 6  | design/tokens-and-base | web/design | [05] | 60 |
| 7  | design/components-button-form | web/design | [06] | 90 |
| 8  | design/components-modal-cta | web/design | [07] | 60 |
| 9  | rendering/render-page | web/rendering | [05] | 120 |
| 10 | rendering/schema-org | web/rendering | [09] | 60 |
| 11 | rendering/sitemap-dynamic | web/rendering | [09] | 30 |
| 12 | rendering/robots-env | web/rendering | [09] | 20 |
| 13 | conversion/utm-tracking | web/conversion | [05] | 45 |
| 14 | conversion/lead-form-submit | web/conversion | [03, 08, 13] | 90 |
| 15 | conversion/whatsapp-modal | web/conversion | [14] | 60 |
| 16 | monitoring/ga4-events | web/monitoring | [15, 10] | 60 |
| 17 | monitoring/gsc-sitemap | web/monitoring | [11, 16] | 30 |
| 18 | generation/manual-compose | web/generation | [09, 08] | 60 |
| 19 | piloto/selecao-termos | operacional | [18] | 30 |
| 20 | piloto/publicar-paginas | operacional | [19] | 60 |
| 21 | piloto/vercel-deploy | infra | [20, 12] | 45 |
| 22 | piloto/validacao-funil | operacional | [21, 16, 17] | 120 |

---

## Caminho crítico

```
data-model/07 → 08 → 09 → 10 → types-update
  → rendering/render-page → schema-org
  → conversion/lead-form-submit → whatsapp-modal
  → monitoring/ga4-events → gsc-sitemap
  → piloto/selecao → publicar → deploy → validacao-funil
```

**Tempo estimado do caminho crítico**: ~15h de trabalho do agente.

---

## Trilhas paralelizáveis

Após `data-model/types-update` concluir, **3 trilhas** podem rodar em paralelo:

- **Trilha A (design)**: `tokens-and-base → components-button-form → components-modal-cta` (~3.5h)
- **Trilha B (rendering)**: `render-page → schema-org → sitemap → robots` (~3.5h)
- **Trilha C (conversion)**: `utm-tracking` (~45min; depois espera `lead-form-submit` que depende de design)

---

## Detalhe das issues

### data-model/07-paginas
**Behavior**: `web/data-model`
**Objetivo**: Migration SQL para a tabela `paginas` no Supabase.

Colunas:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `termo_id uuid REFERENCES termos(id) ON DELETE SET NULL`
- `slug text UNIQUE NOT NULL` — ex: `ia-chat-para-empresa`
- `titulo text NOT NULL`
- `subtitulo text`
- `corpo_mdx text NOT NULL` — conteúdo completo em MDX/markdown
- `meta_title text`
- `meta_description text`
- `og_image_url text`
- `faq_jsonb jsonb` — array de `{pergunta, resposta}` (optional)
- `cta_whatsapp_texto text DEFAULT 'Falar com especialista'`
- `status text NOT NULL DEFAULT 'rascunho'` — enum: `rascunho | publicado | arquivado`
- `publicado_em timestamptz`
- `criado_em timestamptz DEFAULT now()`
- `atualizado_em timestamptz DEFAULT now()`

RLS:
- `SELECT` público apenas para `status = 'publicado'`
- `INSERT/UPDATE/DELETE` apenas via service_role (sem acesso client direto)

Índices: `slug`, `status`, `termo_id`.

---

### data-model/08-variacoes
**Behavior**: `web/data-model`
**Objetivo**: Migration SQL para `variacoes` (preparar para A/B na Fase 2, mas já estruturar agora).

Colunas:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `pagina_id uuid REFERENCES paginas(id) ON DELETE CASCADE`
- `nome text NOT NULL` — ex: `controle`, `variacao-a`
- `corpo_mdx text` — null = usa o da página principal
- `ativa boolean DEFAULT true`
- `criado_em timestamptz DEFAULT now()`

Por padrão, toda página criada deve ter uma variação `controle` criada automaticamente via trigger.

---

### data-model/09-leads
**Behavior**: `web/data-model`
**Objetivo**: Migration SQL para `leads`.

Colunas:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `pagina_id uuid REFERENCES paginas(id) ON DELETE SET NULL`
- `variacao_id uuid REFERENCES variacoes(id) ON DELETE SET NULL`
- `nome text NOT NULL`
- `email text NOT NULL`
- `telefone text NOT NULL`
- `utm_source text`
- `utm_medium text`
- `utm_campaign text`
- `utm_content text`
- `utm_term text`
- `ip_hash text` — SHA-256 do IP (LGPD; não salvar IP cru)
- `user_agent_hash text` — SHA-256 (LGPD)
- `criado_em timestamptz DEFAULT now()`

Deduplicação: índice único `(email, telefone, pagina_id)` com exclusão de duplicados em janela de 5min (via função PL/pgSQL + constraint deferrable ou trigger).

RLS: NENHUM acesso client — route handler com service_role apenas.

---

### data-model/10-metricas-diarias
**Behavior**: `web/data-model`
**Objetivo**: Migration SQL para `metricas_diarias` (agregação diária por página, para dashboard futuro).

Colunas:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `pagina_id uuid REFERENCES paginas(id) ON DELETE CASCADE`
- `data date NOT NULL`
- `sessoes integer DEFAULT 0`
- `pageviews integer DEFAULT 0`
- `leads integer DEFAULT 0`
- `cliques_whatsapp integer DEFAULT 0`
- `ctr_whatsapp numeric(5,4) GENERATED ALWAYS AS (CASE WHEN pageviews > 0 THEN cliques_whatsapp::numeric / pageviews ELSE 0 END) STORED`
- `taxa_conversao numeric(5,4) GENERATED ALWAYS AS (CASE WHEN sessoes > 0 THEN leads::numeric / sessoes ELSE 0 END) STORED`
- `criado_em timestamptz DEFAULT now()`

Índice único: `(pagina_id, data)`.

---

### data-model/types-update
**Behavior**: `web/data-model`
**Objetivo**: Atualizar `src/lib/database.types.ts` com os 4 novos tipos: `paginas`, `variacoes`, `leads`, `metricas_diarias`.

---

### design/tokens-and-base
**Behavior**: `web/design`
**Objetivo**: Definir tokens Tailwind v4 no `globals.css` + `tailwind.config.ts` para o IDeiaPages.

Tokens obrigatórios:
- Cores: `brand-primary` (azul Ideia), `brand-cta` (verde WhatsApp `#25D366`), `brand-dark`, `neutral-*`
- Tipografia: `font-sans` = Inter, `font-display` = Inter tight
- Espaçamentos customizados: `section-y`, `container-max`
- Radii e sombras do design system

---

### design/components-button-form
**Behavior**: `web/design`
**Objetivo**: Criar componentes React base:
- `Button` (variants: `primary`, `ghost`, `whatsapp`; sizes: `sm`, `md`, `lg`)
- `Input` + `Label` + `FormField` (wrapper com erro)
- `LeadForm` (nome + email + telefone + submit)

Todos com Tailwind, acessíveis (aria-labels), sem dependência de shadcn ainda.

---

### design/components-modal-cta
**Behavior**: `web/design`
**Objetivo**:
- `WhatsAppModal` — dialog (client component) que captura antes de redirecionar
- `FloatingCTA` — botão fixo mobile com ícone WhatsApp
- `StickyHeader` — header que aparece ao rolar (IntersectionObserver)

---

### rendering/render-page
**Behavior**: `web/rendering`
**Objetivo**: Rota dinâmica `app/blog/[slug]/page.tsx` (App Router, RSC).

- Fetch server-side do Supabase (client server-side): busca `paginas` por `slug` onde `status = 'publicado'`
- Retorna 404 se não encontrado
- `generateMetadata` com title, description, canonical, og:image dinâmico
- Layout: Hero + corpo markdown renderizado + FAQ section + CTAs distribuídos
- Integra `schema-org` (JSON-LD inline)

---

### rendering/schema-org
**Behavior**: `web/rendering`
**Objetivo**: Componente `SchemaOrg` que injeta JSON-LD:
- `Article` (sempre)
- `FAQPage` (se `faq_jsonb` não vazio)
- `BreadcrumbList` (Home → Blog → Página)

Usando `schema-dts` (já no package.json).

---

### rendering/sitemap-dynamic
**Behavior**: `web/rendering`
**Objetivo**: Atualizar `app/sitemap.ts` para buscar todas as páginas com `status = 'publicado'` do Supabase e gerar entradas `url`, `lastModified`, `changeFrequency`, `priority`.

---

### rendering/robots-env
**Behavior**: `web/rendering`
**Objetivo**: Atualizar `app/robots.ts`:
- `NEXT_PUBLIC_ENV = 'production'` → allow all + sitemap URL
- Qualquer outro valor → `Disallow: /` (bloqueia bots em preview/dev)

---

### conversion/utm-tracking
**Behavior**: `web/conversion`
**Objetivo**: Módulo `src/lib/utm.ts` (client-side):
- Ao carregar a página, lê UTMs da URL (`?utm_source=…`)
- Se presentes, grava em cookie `__utm` (90 dias, SameSite=Lax)
- Exporta `getStoredUtms(): UtmParams | null` para usar no form

Implementar como custom hook `useUtmTracking()` para usar nos client components.

---

### conversion/lead-form-submit
**Behavior**: `web/conversion`
**Objetivo**: Route handler `app/api/leads/route.ts` (POST):
- Recebe `{nome, email, telefone, pagina_id, variacao_id, utms}`
- Valida com Zod (email válido, telefone 10-11 dígitos, nome ≥ 2 chars)
- Deduplicação: checar `leads` por `(email, telefone, pagina_id)` nos últimos 5min; se existir, retorna 200 sem duplicar
- Hash de IP (`crypto.createHash('sha256').update(ip).digest('hex')`)
- Insere via Supabase service_role
- Responde `{success: true, redirect_url}` em < 500ms
- Dispara evento GA4 via Measurement Protocol (opcional na v1)

---

### conversion/whatsapp-modal
**Behavior**: `web/conversion`
**Objetivo**: `WhatsAppModal` integrado ao `LeadForm`:
- Abre ao clicar em qualquer CTA "Falar no WhatsApp"
- Ao submeter com sucesso → chama `/api/leads` → redireciona para `wa.me/NUMERO?text=...` com mensagem pré-preenchida (inclui keyword da página)
- Fecha com Escape e clique fora
- Acessível (focus trap, aria-modal)

---

### monitoring/ga4-events
**Behavior**: `web/monitoring`
**Objetivo**: Setup GA4 via `@next/third-parties/google`:
- `GoogleAnalytics` no `layout.tsx` (só em produção)
- Eventos customizados: `lead_submit`, `whatsapp_open`, `form_start`, `form_abandon`
- Utilitário `trackEvent(name, params)` que chama `gtag('event', …)`

---

### monitoring/gsc-sitemap
**Behavior**: `web/monitoring`
**Objetivo**: Documentação operacional em `web/README.md`:
- Como adicionar propriedade no GSC
- Como submeter sitemap (`/sitemap.xml`)
- Checklist pós-deploy (Rich Results Test, PageSpeed, GSC)

---

### generation/manual-compose
**Behavior**: `web/generation`
**Objetivo**: Script/helper `web/scripts/compose-page.ts`:
- Recebe `termo_id` ou `slug` como argumento
- Busca o briefing em `briefings_seo` via Supabase
- Gera um rascunho de página (título, subtítulo, corpo MDX com headings, FAQs do briefing) usando um template local (sem LLM — apenas extração de campos do JSONB)
- Printa o INSERT SQL ou faz o INSERT direto no Supabase (flag `--dry-run`)
- Permite ao Júnior publicar em 1 comando: `tsx scripts/compose-page.ts --termo-id <uuid> --publish`

---

### piloto/selecao-termos
**Behavior**: operacional
**Objetivo**: Júnior seleciona 5-10 termos com `briefing_pronto` para o piloto usando o helper acima.

Critérios sugeridos (automáticos, com override manual):
1. `score_conversao` alto
2. `intencao IN ('transacional', 'comercial')`
3. Mix de clusters diferentes

---

### piloto/publicar-paginas
**Behavior**: operacional
**Objetivo**: Para cada termo selecionado, rodar `compose-page.ts` + revisar rascunho + mudar `status` para `publicado`.

---

### piloto/vercel-deploy
**Behavior**: infra
**Objetivo**: Deploy do `ideiapages/web` no Vercel + configurar proxy reverso para `ideiamultichat.com.br/blog/*` → projeto Vercel.

Checklist:
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas env vars Vercel
- `SUPABASE_SERVICE_ROLE_KEY` (só server-side) nas env vars Vercel
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_ENV=production`
- Rewrite no Vercel ou config no servidor de `ideiamultichat.com.br`

---

### piloto/validacao-funil
**Behavior**: operacional
**Objetivo**: Coleta de 2 semanas → relatório de funil:
- Sessões, pageviews, leads, taxa de conversão por página
- Verificar GA4: `lead_submit` e `whatsapp_open`
- Verificar GSC: impressões > 0 em ≥ 80% das páginas
- Meta: taxa de conversão média ≥ 1%
- Relatório gerado em `research/data/relatorios/fase-1-<timestamp>.md`

---

## Dependências externas (bloqueios potenciais)

| Item | Responsável | Risco |
|------|-------------|-------|
| Proxy reverso Vercel em `ideiamultichat.com.br/blog` | time de infra / DNS | Médio — exige acesso ao DNS/servidor principal |
| Número WhatsApp oficial (para `wa.me/NUMERO`) | Júnior | Baixo — já deve existir |
| GA4 Property ID | Júnior | Baixo — configurar no GA4 console |
| Opt-in LGPD (checkbox vs texto) | Júnior / jurídico | Médio — decisão de negócio |

---

## Entregáveis verificáveis ao final

- [ ] 4 migrations aplicadas no Supabase (`paginas`, `variacoes`, `leads`, `metricas_diarias`)
- [ ] `database.types.ts` regenerado com novos tipos
- [ ] 5-10 páginas publicadas em `ideiamultichat.com.br/blog/<slug>`
- [ ] Cada página passa no Rich Results Test
- [ ] Form de captura grava lead no Supabase em < 500ms
- [ ] GA4 recebendo `lead_submit` e `whatsapp_open`
- [ ] `sitemap.xml` listando páginas publicadas
- [ ] `robots.txt` bloqueando crawl em ambientes não-produção
- [ ] 2 semanas de dados coletados + relatório gerado
