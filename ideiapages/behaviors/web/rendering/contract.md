---
behavior: web/rendering
status: draft
created: 2026-04-23
owner: junior
---

# Contract — Web Rendering (Fase 1)

## Objetivo

Expor páginas SEO **dinâmicas** em `/blog/[slug]`, com metadata completa, JSON-LD válido, `sitemap.xml` e `robots.txt` conforme ambiente, consumindo dados de `paginas` no Supabase.

## Escopo deste domínio

| Sub-entrega | Behavior lógico |
|-------------|-----------------|
| `render-page` | Rota App Router, RSC, fetch por `slug`, 404 se ausente ou não publicado |
| `schema-org` | Componente JSON-LD: Article, FAQPage (se FAQ), BreadcrumbList |
| `sitemap` | `sitemap.ts` dinâmico: só `status = 'publicado'` |
| `robots` | `robots.ts`: produção liberada; demais ambientes `Disallow: /` |

## Triggers

1. Visitante acessa `/blog/<slug>` → servidor busca página publicada.
2. Crawler solicita `/sitemap.xml` ou `/robots.txt`.
3. Operador publica página → próximo build/ISR/refetch reflete URL no sitemap (definir estratégia de revalidação na implementação).

## Comportamentos esperados

### `render-page`

- Usar cliente Supabase **server-side** com chave adequada: leitura só de linhas públicas (RLS) ou service read-only conforme decisão de arquitetura — **nunca** expor `service_role` ao bundle cliente.
- Layout: hero (título, subtítulo), corpo MDX/markdown, FAQ, CTAs distribuídos (regra de espaçamento da spec: ~600 palavras, CTA final, sticky, flutuante mobile).
- `generateMetadata`: `title`, `description`, `canonical`, `openGraph` / `og:image` a partir de `paginas`.

### `schema-org`

- Usar `schema-dts` (ou equivalente já no `package.json`).
- `Article` sempre que for página de conteúdo.
- `FAQPage` quando `faq_jsonb` tiver itens.
- `BreadcrumbList`: Home → Blog → slug atual (URLs alinhadas a `NEXT_PUBLIC_SITE_URL`).

### Sitemap

- Entradas com `url`, `lastModified` (`publicado_em` ou `atualizado_em`), `changeFrequency`, `priority` razoáveis.
- Excluir rascunhos e arquivados.

### Robots

- `NEXT_PUBLIC_ENV === 'production'` (ou variável canônica do projeto): allow + link sitemap absoluto.
- Caso contrário: bloquear crawl completo.

## Entradas / saídas

**Entradas**: linhas `paginas` publicadas; `references/seo_rules.md`; variáveis de ambiente públicas.

**Saídas**: HTML com LCP/CLS dentro das metas da spec; JSON-LD validável no Rich Results Test.

## Critérios de aceitação

- [ ] `/blog/[slug]` retorna 200 só para publicado; 404 caso contrário.
- [ ] Metadata e canonical corretos por página.
- [ ] JSON-LD sem erros no Rich Results Test em todas as piloto.
- [ ] Sitemap lista apenas URLs publicadas.
- [ ] Robots bloqueia não-prod conforme contract.

## Não-objetivos

- ISR global ou edge em múltiplas regiões (otimizar depois).
- Internacionalização.
- Preview autenticado de rascunho via URL pública (opcional futuro).

## Referências

- Spec: `specs/fase-1-paginas-piloto.md`
- Break: `specs/fase-1-paginas-piloto.break.md` (rendering/*)
