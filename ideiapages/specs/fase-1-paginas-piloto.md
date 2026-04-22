---

## fase: fase-1-paginas-piloto

status: draft
created: 2026-04-22
owner: junior

# Spec — Fase 1: Páginas Piloto

## Objetivo

Publicar **5 a 10 páginas SEO piloto** em `ideiamultichat.com.br/blog` (via proxy reverso Vercel), construídas a partir dos briefings da Fase 0, capturando leads qualificados e validando o funil `visita → lead → WhatsApp → comercial`. Sem isso, não sabemos se o modelo "briefing → página → lead" funciona antes de escalar com multi-IA (Fase 2).

## Contexto

A Fase 0 entregou uma fila de 20-50 termos com `briefing_pronto`. A Fase 1 transforma **uma seleção manual** desses briefings em páginas reais renderizadas pelo Next.js, publicadas sob o domínio do produto principal (Ideia Chat) via proxy reverso. O foco é provar a **tese de conversão** (≥ 1% de taxa de lead) antes de investir em geração multi-IA e A/B. Esta fase introduz o lado **web** do monorepo: rendering + conversion + tracking básico. Geração continua manual (ou semi-manual com prompt único) — **não é** a camada multi-IA ainda.

## Escopo da fase (behaviors envolvidos)

Esta fase materializa behaviors nos domínios `rendering`, `conversion`, `monitoring` e um piloto mínimo de `generation`:

1. `rendering/render-page` — página dinâmica Next.js por slug do termo (App Router, RSC)
2. `rendering/schema-org` — JSON-LD (Article / FAQPage / BreadcrumbList) conforme `seo_rules.md`
3. `rendering/sitemap` — `sitemap.xml` dinâmico listando páginas publicadas
4. `rendering/robots` — `robots.txt` + regras por ambiente (prod aberto, preview noindex)
5. `conversion/lead-form-submit` — route handler persiste lead + UTMs em `leads`
6. `conversion/whatsapp-modal` — modal de captura antes do `wa.me/...`
7. `conversion/utm-tracking` — first-touch UTM em cookie + replicado no lead
8. `monitoring/basic-tracking` — GA4 events + integração inicial com Google Search Console
9. `generation/manual-page-compose` *(piloto)* — helper interno que transforma briefing em rascunho editável (sem multi-IA)

Cada behavior ganhará seu `contract.md` quando não for trivial (ex: `lead-form-submit`, `render-page`, `whatsapp-modal`).

## Triggers

1. **Operador (Júnior)** seleciona N briefings `briefing_pronto` da Fase 0 e cria/edita rascunho da página (MDX ou linha na tabela `paginas`)
2. **Operador publica** a página mudando `status` de `rascunho` → `publicado`
3. **Visitante** chega na página por tráfego orgânico (Google) ou direto
4. **Visitante** interage com CTA → abre modal → submete form → redireciona para WhatsApp
5. **Visitante** clica em CTA flutuante WhatsApp (mobile) → modal → captura → redireciona
6. **Sistema** gera `sitemap.xml` e `robots.txt` automaticamente a partir das páginas publicadas
7. **GSC / GA4** recebem sinais (pageview, lead_submit, whatsapp_open, form_start, form_abandon)

## Comportamentos esperados (alto nível)

### Fluxo principal end-to-end

1. Migrations aplicadas (`paginas`, `variacoes`, `leads`, `metricas_diarias`) e `database.types.ts` regenerado
2. Operador escolhe 5-10 termos com `status = 'briefing_pronto'` da Fase 0 como piloto
3. Para cada termo, um registro é criado em `paginas` referenciando o `termo_id` + conteúdo (corpo + headings + FAQ + CTAs) derivado do briefing
4. Next.js, ao acessar `/blog/<slug>`, faz fetch server-side e renderiza a página com:
   - Hero + subtítulo + CTA primário (WhatsApp)
   - Conteúdo longo conforme briefing (headings, parágrafos, tabelas quando útil)
   - CTAs distribuídos por 600 palavras + 1 CTA final + 1 sticky header + 1 flutuante mobile
   - JSON-LD (Article, FAQPage se aplicável, BreadcrumbList)
   - Metadata dinâmico (title, description, canonical, og:image)
5. Ao clicar em CTA "Falar no WhatsApp", o modal de captura abre **antes** de redirecionar
6. Form submetido: route handler valida, grava em `leads` (nome, email, telefone, utms, pagina_id, variacao_id), responde em < 500ms, cliente redireciona para `wa.me/` com mensagem pré-preenchida
7. GA4 e GSC começam a acumular dados de 2 semanas
8. Operador consulta painel simples (pode ser query Supabase) para medir funil

### Modo de operação esperado

- **Thin client**: form nunca bate direto em banco/LLM — sempre via route handler
- **Server Components** por padrão; client components só onde há estado (modal, form)
- **UTMs** capturadas no primeiro touch via cookie (90 dias) e replicadas no lead final
- **Validação dupla**: frontend (UX) + backend (fonte de verdade)
- **Idempotência**: reenviar o mesmo form em < 5s não cria lead duplicado (dedup por email+telefone+pagina_id em janela curta)
- **Paginas publicadas** aparecem no `sitemap.xml` automaticamente; páginas em `rascunho` não
- **RLS**: `leads` bloqueado para client; inserção só via route handler com service_role; `paginas` com select público apenas para `status = 'publicado'`

## Entradas

- ≥ 20 termos com `status = 'briefing_pronto'` e `briefings_seo` populado (output Fase 0, aprovado)
- Design system base definido em `references/design_system.md` (tokens Tailwind + componentes shadcn)
- `references/seo_rules.md`, `references/conversion_principles.md`, `references/product_facts.md` atualizados
- Credenciais em `.env`: Supabase (anon + service_role), GA4 Measurement ID, número WhatsApp oficial, GSC property
- Domínio `ideiamultichat.com.br` com proxy reverso Vercel configurado para `/blog/*`

## Saídas

- **5 a 10 páginas** públicas em `https://ideiamultichat.com.br/blog/<slug>` retornando 200 + HTML completo
- Tabela `paginas` com registros em `status = 'publicado'`; cada página associada a `termo_id` da Fase 0
- Tabela `leads` com registros reais das sessões do piloto
- `sitemap.xml` publicado em `/sitemap.xml` listando as páginas ativas
- `robots.txt` correto (prod libera crawl; preview/dev bloqueia)
- JSON-LD válido (validável no Rich Results Test) em cada página
- GA4 recebendo pageviews e eventos: `lead_submit`, `whatsapp_open`, `form_start`, `form_abandon`
- GSC conectado, sitemap submetido, impressões/cliques começando a aparecer
- Relatório Fase 1 em `research/data/relatorios/fase-1-<timestamp>.md`: funil por página, top CTAs, custo de aquisição estimado
- Checklist de performance (LCP, CLS, INP) rodado com PageSpeed / Web Vitals

## Critérios de "feito" (verificáveis no fim)

- Migrations da Fase 1 aplicadas (`paginas`, `variacoes`, `leads`, `metricas_diarias`) com RLS
- `database.types.ts` regenerado e tipagem estrita sem erros
- 5-10 páginas publicadas e acessíveis publicamente no domínio `ideiamultichat.com.br/blog`
- Cada página passa no **Rich Results Test** para JSON-LD
- Cada página tem **LCP < 2.5s** e **CLS < 0.1** em mobile (PageSpeed)
- Form de captura valida nome/email/telefone e grava em `leads`; fluxo retorna sucesso em < 500ms (p95) local
- Redirecionamento para `wa.me/` acontece **somente** após captura bem-sucedida
- UTMs são capturadas no primeiro touch e replicadas no lead
- GA4 recebe `lead_submit` e `whatsapp_open`; GSC submetido com sitemap; impressões > 0 em 14 dias
- Coleta de 2 semanas de dados concluída, com ≥ 100 sessões totais nas páginas piloto
- **Taxa de conversão média das páginas piloto ≥ 1%** (lead submetido / sessões)
- Zero vazamento de API key para client (auditoria de bundle)
- Documentação "como publicar uma página" atualizada em `web/README.md`
- Aprovação do Júnior registrada em `ROADMAP.md` (§ Histórico de aprovações)

## Não-objetivos (out of scope desta fase)

- Multi-IA (Claude + GPT + Gemini) — Fase 2
- Quality gate automático de página gerada — Fase 2
- A/B testing com significância estatística — Fase 2
- Dashboard interno de performance — Fase 3
- Recomendações automáticas de próxima página — Fase 3
- Detecção de queda de ranking e auto-rewrite — Fase 4
- Escala para 100+ páginas — Fase 4
- Multilíngue (apenas pt-BR)
- Blog em CMS (WordPress/Sanity/etc.) — tudo em Next.js + Supabase
- Editor WYSIWYG para operador — edição por código/JSON/MDX é suficiente no piloto
- Comentários, likes, compartilhamento social — não é blog comunidade, é captura
- Integração com CRM externo — lead fica em Supabase; export manual no MVP

## Métricas de sucesso


| Métrica                                                       | Alvo                     |
| ------------------------------------------------------------- | ------------------------ |
| Páginas publicadas                                            | 5-10                     |
| Taxa de conversão média (lead / sessão)                       | ≥ 1%                     |
| Click rate no CTA WhatsApp                                    | ≥ 8%                     |
| Captura → envio ao WhatsApp                                   | ≥ 70%                    |
| LCP mobile (mediana)                                          | < 2.5 s                  |
| JSON-LD válido em 100% das páginas                            | sim                      |
| Impressões GSC no período de 14 dias                          | > 0 em ≥ 80% das páginas |
| Leads com UTMs preenchidos corretamente                       | ≥ 95%                    |
| Duplicados reais (mesmo email + telefone em < 5 min)          | 0                        |
| Tempo de publicação de uma nova página (briefing → publicado) | < 2 h                    |


## Riscos / decisões em aberto

1. **Proxy reverso Vercel em `ideiamultichat.com.br/blog`** — exige configuração no DNS/servidor do site principal; confirmar acesso e janela de deploy com o time de infra
2. **Fonte de conteúdo das páginas piloto** — gerado manualmente por Júnior a partir do briefing, ou usando um prompt único Claude Sonnet "gerador piloto"? Decisão no `/break`
3. **Edição de conteúdo** — MDX em repo vs. JSON na tabela `paginas`? Trade-off: MDX é mais legível/versionado; tabela permite edição sem deploy. Sugestão MVP: tabela + rascunho local em repo
4. **Número WhatsApp oficial** — qual número recebe os leads? Precisa estar com capacidade para múltiplos atendentes (Ideia Chat mesmo, naturalmente)
5. **GA4 vs PostHog vs Plausible** — GA4 já é padrão do grupo; seguir GA4, documentar eventos em `references/seo_rules.md`
6. **Deduplicação de leads** — janela, chave (email? telefone? ambos?), comportamento (ignora vs. atualiza UTMs) — definir no `/plan` de `lead-form-submit`
7. **Opt-in LGPD** — checkbox explícito ou texto abaixo do botão? Conversão vs conformidade; decidir com jurídico
8. **Design system pronto vs em construção** — se tokens ainda faltam, Fase 1 pode atrasar; priorizar botão, form, modal, hero, CTA flutuante
9. **Fallback se WhatsApp indisponível** — mensagem clara no modal + link para email comercial? Risco baixo mas existente
10. **Critério de seleção dos 5-10 termos piloto** — maior score, mistura de intents, ou manual? Sugerir filtro automático + override manual

## Próximo passo após `/spec`

Rodar `/break fase-1-paginas-piloto` para gerar as issues (uma por behavior, ordenadas por dependência: migrations primeiro → design base → rendering core → conversion → tracking → deploy/validação).
