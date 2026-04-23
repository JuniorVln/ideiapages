---
behavior: web/design
status: draft
created: 2026-04-23
owner: junior
---

# Contract — Web Design System (Fase 1)

## Objetivo

Definir **tokens visuais** e **componentes UI base** usados pelas páginas piloto e pelo funil de conversão, alinhados a `references/design_system.md` e à spec da Fase 1.

## Escopo deste domínio

| Entrega | Descrição |
|---------|-----------|
| Tokens | Tailwind v4 / `globals.css` + config: cores marca, CTA WhatsApp (`#25D366`), tipografia, espaçamentos (`section-y`, `container-max`), radii, sombras |
| Componentes base | `Button`, `Input`, `Label`, `FormField`, `LeadForm` |
| Componentes CTA | `WhatsAppModal`, `FloatingCTA`, `StickyHeader` |

## Triggers

1. Dev implementa tokens antes dos componentes que os consomem.
2. Páginas e modais importam apenas estes primitives (sem one-off CSS solto para o mesmo padrão).

## Comportamentos esperados

### Tokens

- **`brand-primary`**, **`brand-cta`** (WhatsApp), **`brand-dark`**, escala **`neutral-*`**.
- **`font-sans`** = Inter; **`font-display`** coerente com spec (Inter tight se aplicável).
- Contraste mínimo **WCAG AA** em textos sobre fundos de marca.

### Button

- Variants: `primary`, `ghost`, `whatsapp`.
- Sizes: `sm`, `md`, `lg`.
- Estados: hover, focus visível, disabled, `aria-busy` quando aplicável.

### Form

- `LeadForm`: campos nome, email, telefone, submit; mensagens de erro acessíveis (`aria-describedby`).
- Validação visual imediata; **fonte de verdade** permanece o route handler (Zod).

### WhatsAppModal

- Client component: abre antes de redirecionar ao `wa.me`.
- Fecha com Escape, clique fora, botão fechar; **focus trap** e `aria-modal="true"`.

### FloatingCTA / StickyHeader

- `FloatingCTA`: fixo em mobile, ícone WhatsApp, não cobre conteúdo crítico (safe area).
- `StickyHeader`: aparece ao scroll (IntersectionObserver), CTA consistente com hero.

## Entradas / saídas

**Entradas**: `references/design_system.md`, `references/conversion_principles.md`, spec Fase 1.

**Saídas**: arquivos em `web/` (paths exatos na issue `design/*` do break); componentes exportados para `rendering` e `conversion`.

## Critérios de aceitação

- [ ] Tokens aplicados em hero, botões e modal sem hardcode de hex fora dos tokens.
- [ ] `LeadForm` usável só com teclado e leitor de tela (labels + erros).
- [ ] `WhatsAppModal` integrável ao fluxo descrito em `web/conversion` (props de callback claras).
- [ ] Nenhuma dependência obrigatória de shadcn na primeira entrega (break permite “sem shadcn ainda”); se adicionar shadcn depois, não quebrar API pública dos wrappers.

## Não-objetivos

- Biblioteca completa de marketing site (carrossel, depoimentos complexos).
- Dark mode completo (opcional pós-piloto).
- Temas por tenant.

## Referências

- Spec: `specs/fase-1-paginas-piloto.md`
- Break: `specs/fase-1-paginas-piloto.break.md` (design/tokens-and-base, components-button-form, components-modal-cta)
