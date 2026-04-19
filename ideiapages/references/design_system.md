# Design System — IDeiaPages

> Tokens, componentes e padrões visuais. Lido por `component-writer` e `seo-page-writer`.

---

## Princípios visuais

1. **Conversão acima de estética** — beleza serve à conversão, nunca o contrário.
2. **Hierarquia clara** — uma tela, um CTA primário.
3. **Mobile-first** — 70%+ do tráfego orgânico vem de mobile.
4. **Contraste alto** — WCAG AA mínimo, AAA em CTAs.
5. **Performance é design** — fontes locais, imagens otimizadas, zero CLS.

---

## Paleta (alinhada ao Ideia Chat)

```
Primary   #25D366  (WhatsApp green - CTA primário)
Primary-d #128C7E  (hover / dark)
Accent    #075E54  (header/footer)
Neutral-0 #FFFFFF  (background)
Neutral-1 #F7F7F7  (surface alt)
Neutral-2 #E5E7EB  (border)
Neutral-7 #4B5563  (text secondary)
Neutral-9 #111827  (text primary)
Success   #10B981
Warning   #F59E0B
Danger    #EF4444
```

Definir em `web/tailwind.config.ts` como tokens semânticos:

```ts
colors: {
  brand: {
    DEFAULT: '#25D366',
    dark: '#128C7E',
    accent: '#075E54',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    alt: '#F7F7F7',
  },
  text: {
    DEFAULT: '#111827',
    muted: '#4B5563',
  },
}
```

---

## Tipografia

- **Heading**: Inter (700, 800) — local via `next/font`
- **Body**: Inter (400, 500, 600)
- **Mono**: JetBrains Mono (apenas para código em blog posts técnicos)

Escala (mobile / desktop):

| Token | Mobile | Desktop |
|-------|--------|---------|
| h1 | 32px | 48px |
| h2 | 24px | 36px |
| h3 | 20px | 28px |
| body | 16px | 16px |
| small | 14px | 14px |

Line-height: 1.2 (headings), 1.6 (body).

---

## Spacing scale

Tailwind default (4px). Uso semântico:

- Section vertical padding: `py-16 md:py-24`
- Container horizontal: `px-4 md:px-8 max-w-6xl mx-auto`
- Card padding: `p-6`
- Botão padding: `px-6 py-3`

---

## Componentes obrigatórios

Todos em `web/src/components/ui/` (base) ou `web/src/behaviors/<dominio>/<behavior>/components/` (específicos).

### CTA Primário

```tsx
<Button variant="primary" size="lg">
  Falar no WhatsApp agora
</Button>
```

- Cor: `bg-brand text-white`
- Tamanho mínimo: 48x48px (toque mobile)
- Sombra: `shadow-lg shadow-brand/30`
- Hover: `bg-brand-dark`
- Sempre verbal e direto ("Falar agora", não "Saiba mais")

### Lead Form

Campos mínimos: **nome, email, telefone**. Sem campos opcionais que reduzem conversão.

- Validação client-side: HTML5 + zod
- Submit via route handler `/api/leads`
- Feedback de erro inline, não em alert
- Após sucesso: redireciona para WhatsApp ou exibe agradecimento

### WhatsApp Modal

Abre quando usuário clica "Falar no WhatsApp" SEM preencher form direto. Pede dados ANTES de redirecionar.

- Não usar `window.open` direto. Sempre passar pelo modal.
- Salvar lead no Supabase ANTES de abrir `wa.me/<numero>`.
- Mensagem padrão preenchida com termo da página (UTM term).

---

## Layouts de página

Todas as páginas seguem este esqueleto base:

```
┌──────────────────────────────────┐
│ Header (logo + WhatsApp link)    │
├──────────────────────────────────┤
│ Hero (H1 + subtitle + CTA)       │
├──────────────────────────────────┤
│ Conteúdo específico do tipo:     │
│  - blog-post: artigo + sidebar   │
│  - landing-page: features + form │
│  - comparison: tabela + CTA      │
│  - faq: accordion + CTA          │
├──────────────────────────────────┤
│ Social proof (depoimentos)       │
├──────────────────────────────────┤
│ CTA final (form ou WhatsApp)     │
├──────────────────────────────────┤
│ Footer (links + WhatsApp fixo)   │
└──────────────────────────────────┘
```

WhatsApp button fixo flutuante no canto inferior direito em mobile.

---

## Animações

- Apenas micro-interações (hover, focus).
- **NUNCA** animação que atrasa LCP ou interaction.
- Sem framer-motion no MVP — CSS transitions nativas bastam.
- Respeitar `prefers-reduced-motion`.
