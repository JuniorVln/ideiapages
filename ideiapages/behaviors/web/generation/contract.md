---
behavior: web/generation
status: draft
created: 2026-04-23
owner: junior
---

# Contract — Web Generation (piloto manual, Fase 1)

## Objetivo

Fornecer **helper operacional** que transforma um registro de `briefings_seo` (Fase 0) em rascunho de `paginas` (MDX/conteúdo + metadados), **sem multi-IA** — apenas template e extração de campos do JSONB — para publicação rápida no piloto.

## Escopo deste domínio

| Entrega | Descrição |
|---------|-----------|
| `manual-page-compose` | Script `web/scripts/compose-page.ts` (ou path canônico): CLI com `--termo-id` / `--slug`, `--dry-run`, opcional `--publish` |

## Triggers

1. Operador escolhe termo `briefing_pronto`.
2. Roda script → gera SQL `INSERT` ou executa insert no Supabase (service_role local / env).
3. Opcional `--publish`: seta `status = 'publicado'` e `publicado_em` (se política do projeto permitir automação).

## Comportamentos esperados

1. Buscar `briefings_seo` + `termos` por `termo_id` ou `slug`.
2. Mapear campos do briefing para: `titulo`, `subtitulo`, `corpo_mdx` (headings H2/H3, parágrafos), `meta_title`, `meta_description`, `faq_jsonb`, `slug` deduzido ou informado.
3. Garantir que `corpo_mdx` respeite estrutura esperada pelo renderer (componentes MDX permitidos documentados).
4. Se página já existir para o `termo_id`, falhar ou `--force` (definir na issue).
5. Após insert, garantir existência de variação `controle` (via trigger DB — não duplicar lógica se trigger já cria).

## Entradas / saídas

**Entradas**: Supabase com Fase 0 populada; `.env` com credenciais server; briefing JSON válido.

**Saídas**: registro em `paginas` (rascunho ou publicado); log legível no stdout para auditoria.

## Critérios de aceitação

- [ ] CLI documentada em `web/README.md` com exemplo único copy-paste.
- [ ] Modo `--dry-run` imprime SQL ou payload sem efeitos.
- [ ] Nenhuma chamada LLM neste behavior (Fase 2 assumirá generators).
- [ ] Slug único validado antes de insert.

## Não-objetivos

- Geração com Claude/GPT/Gemini.
- Quality gate automático de conteúdo.
- Agendamento ou fila de jobs.

## Referências

- Spec: `specs/fase-1-paginas-piloto.md` (seção piloto + `generation/manual-page-compose`)
- Break: `specs/fase-1-paginas-piloto.break.md` (generation/manual-compose, piloto/*)
