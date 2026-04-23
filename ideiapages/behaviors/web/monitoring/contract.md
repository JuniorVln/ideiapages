---
behavior: web/monitoring
status: draft
created: 2026-04-23
owner: junior
---

# Contract — Web Monitoring (Fase 1)

## Objetivo

Instrumentar o app Next.js para **GA4** (pageview + eventos de funil) e documentar **Google Search Console** (propriedade + sitemap), permitindo validar métricas da Fase 1 sem dashboard interno.

## Escopo deste domínio

| Sub-entrega | Descrição |
|-------------|-----------|
| `ga4-events` | `@next/third-parties/google` ou snippet oficial; só em produção; utilitário `trackEvent(name, params)` |
| `gsc-sitemap` | Documentação operacional em `web/README.md` (propriedade, verificação, envio de sitemap, checklist pós-deploy) |

## Eventos obrigatórios (GA4)

| Nome | Momento |
|------|---------|
| `page_view` | Automático GA4 / app router (confirmar integração) |
| `whatsapp_open` | Ao abrir modal ou clicar CTA que abre modal |
| `form_start` | Primeira interação em campo do `LeadForm` |
| `form_abandon` | Modal fechado sem submit após `form_start` |
| `lead_submit` | Após resposta bem-sucedida de `POST /api/leads` |

Parâmetros recomendados: `pagina_id`, `slug`, `variacao_id` (quando houver), `utm_*` se útil e permitido pela política de PII do GA4.

## Triggers

1. Deploy produção com `NEXT_PUBLIC_GA4_ID` definido → script carregado.
2. Operador segue README para cadastrar site no GSC e enviar `https://.../sitemap.xml`.
3. Após 14 dias, conferir impressões e eventos conforme critérios da spec.

## Entradas / saídas

**Entradas**: `NEXT_PUBLIC_GA4_ID`, URL pública do site, sitemap gerado pelo domínio `rendering`.

**Saídas**: eventos visíveis no GA4 DebugView (dev opcional) e relatório Fase 1; documentação GSC atualizada.

## Critérios de aceitação

- [ ] GA4 não carrega em `preview`/dev que simula não-prod (alinhar com variável de ambiente).
- [ ] `trackEvent` tipado ou encapsulado (sem strings mágicas espalhadas sem constantes).
- [ ] Eventos `lead_submit` e `whatsapp_open` validados em ambiente de staging/prod.
- [ ] `web/README.md` com passos de GSC + Rich Results + PageSpeed conforme break.

## Não-objetivos

- Painel interno (Fase 3).
- Server-side Measurement Protocol obrigatório para `lead_submit` (opcional v1 no break).
- Alertas automatizados de queda (Fase 4).

## Referências

- Spec: `specs/fase-1-paginas-piloto.md`
- Break: `specs/fase-1-paginas-piloto.break.md` (monitoring/*)
- `references/seo_rules.md`
