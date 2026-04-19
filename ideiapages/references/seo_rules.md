# SEO Rules — IDeiaPages

> Regras invioláveis para toda página gerada. Lido por `seo-page-writer` e `quality-reviewer`.

---

## Princípios

1. **Information Gain > Thin content** — toda página adiciona algo que ninguém mais cobre.
2. **Intent match perfeito** — o conteúdo entrega exatamente o que o termo de busca implica.
3. **Schema obrigatório** — todo tipo de página tem schema.org correspondente.
4. **Subdiretório, não subdomínio** — sempre `ideiamultichat.com.br/blog/...`, nunca `blog.ideiamultichat.com.br`.

---

## Tags obrigatórias por página

```html
<!-- HEAD -->
<title>{H1 da página | até 60 chars}</title>
<meta name="description" content="{até 155 chars, com termo principal e benefício}" />
<link rel="canonical" href="https://ideiamultichat.com.br/{slug}" />
<meta name="robots" content="index, follow, max-image-preview:large" />

<!-- Open Graph -->
<meta property="og:title" content="{título}" />
<meta property="og:description" content="{descrição}" />
<meta property="og:image" content="{URL absoluta da imagem 1200x630}" />
<meta property="og:url" content="https://ideiamultichat.com.br/{slug}" />
<meta property="og:type" content="article|website" />
<meta property="og:locale" content="pt_BR" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
```

No App Router, gerar via `generateMetadata` exportada do `page.tsx`.

---

## Schema.org por tipo de página

### Blog post / Guia

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "datePublished": "ISO 8601",
  "dateModified": "ISO 8601",
  "author": { "@type": "Organization", "name": "Ideia Chat" },
  "publisher": {
    "@type": "Organization",
    "name": "Ideia Chat",
    "logo": { "@type": "ImageObject", "url": "..." }
  },
  "mainEntityOfPage": "https://ideiamultichat.com.br/{slug}",
  "image": "..."
}
```

### Landing page (produto/solução)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Ideia Chat",
  "description": "...",
  "brand": { "@type": "Brand", "name": "Ideia Chat" },
  "offers": [
    { "@type": "Offer", "name": "Essencial", "price": "179.90", "priceCurrency": "BRL" }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "400"
  }
}
```

### Comparison page (Ideia Chat vs Concorrente)

Combinar `Article` + `Product` (do Ideia Chat). Citar concorrentes como `mentions`.

### FAQ page

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "...",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    }
  ]
}
```

---

## Heading hierarchy

- **Exatamente 1 H1** por página, contendo o termo-alvo
- H2 a cada seção principal, com termos relacionados (cluster)
- H3 dentro de H2, sem pular níveis
- Nunca usar `<h>` para estilo (usar Tailwind classes)

---

## URL slugs

- Lowercase, hífen como separador
- Sem stop words desnecessárias
- Curto mas descritivo (3-6 palavras)
- Deriva do termo-alvo, não do título

Exemplos:
- Termo: "como ter vários atendentes no whatsapp" → slug: `varios-atendentes-whatsapp`
- Termo: "atendimento whatsapp para escritório de contabilidade" → slug: `atendimento-whatsapp-contabilidade`

---

## Internal linking (Programmatic Internal Linking)

- Toda página linka para 3-5 páginas relacionadas
- Anchor text com termo da página de destino, nunca "clique aqui"
- Linkar de hub para spokes e vice-versa
- Listar links em rodapé de "Conteúdo relacionado"

---

## Sitemap e robots

- `sitemap.xml` gerado dinamicamente em `web/src/app/sitemap.ts`
- Inclui apenas páginas com status `published` no Supabase
- `robots.txt` em `web/src/app/robots.ts` permite tudo exceto `/api/*`

---

## Imagens

- Sempre `next/image`
- `alt` obrigatório, descritivo (não "imagem" ou nome do arquivo)
- Formato: AVIF preferido, fallback WebP
- Lazy loading por padrão, `priority` apenas no hero
- Tamanho mínimo do CTA: 800x600

---

## Indicadores de qualidade (Quality Gate)

Toda página gerada por LLM passa por estes checks antes de publicar:

| Check | Mínimo |
|-------|--------|
| Word count | 600 palavras |
| Headings (H2+H3) | 3 mínimo |
| Termo-alvo no H1 | obrigatório |
| Termo-alvo nos primeiros 100 chars | obrigatório |
| Densidade do termo | 0.5% a 2% |
| CTA presente | mínimo 2 (header + footer) |
| Internal links | mínimo 3 |
| Schema.org válido | obrigatório (validar com `schema-dts`) |
| Sem placeholders ("Lorem", "TODO", "[XXX]") | obrigatório |
| Sem alucinação de fatos | comparar com `references/product_facts.md` |
