---
behavior: web/data-model
status: draft
created: 2026-04-23
owner: junior
---

# Contract — Web Data Model (Fase 1)

## Objetivo

Materializar no Supabase o **esquema mínimo** para páginas piloto, variações (preparação Fase 2), leads e métricas diárias, com **RLS** e invariantes alinhadas a `[specs/fase-1-paginas-piloto.md](../../../specs/fase-1-paginas-piloto.md)`.

## Escopo deste domínio

| Artefato | Descrição |
|----------|-----------|
| Migrations | `paginas`, `variacoes`, `leads`, `metricas_diarias` (+ trigger variação `controle`) |
| Tipos | Regenerar `web/src/lib/database.types.ts` (ou caminho canônico do projeto) após migrations |

## Triggers

1. Operador aplica migrations no Supabase (`supabase db push` ou SQL Editor).
2. Operador regenera tipos TypeScript.
3. Código `web` passa a consumir as tabelas via cliente server-side / service_role conforme cada behavior.

## Tabelas e invariantes

### `paginas`

- FK opcional `termo_id → termos(id) ON DELETE SET NULL`.
- `slug` único, `status` ∈ `rascunho | publicado | arquivado`.
- `corpo_mdx` obrigatório; `faq_jsonb` opcional (array `{pergunta, resposta}`).
- **RLS**: `SELECT` público **somente** `status = 'publicado'`; escrita só `service_role`.

### `variacoes`

- FK `pagina_id → paginas ON DELETE CASCADE`.
- `nome` (ex.: `controle`); `corpo_mdx` nullable (herda da página).
- **Trigger**: ao inserir `paginas`, criar variação `controle` automaticamente (definir na migration).

### `leads`

- FKs `pagina_id`, `variacao_id` (nullable on delete conforme spec).
- Campos UTM + `nome`, `email`, `telefone` obrigatórios; `ip_hash`, `user_agent_hash` (SHA-256, sem PII cru).
- **RLS**: sem acesso `anon` / autenticado cliente; **apenas** inserção server-side com `service_role`.
- **Deduplicação**: mesma combinação `(email, telefone, pagina_id)` em janela **5 min** não gera duplicata (implementação: trigger/função ou lógica API + índice auxiliar — ver issue detalhada no break).

### `metricas_diarias`

- Único `(pagina_id, data)`.
- Colunas agregadas + colunas geradas `ctr_whatsapp`, `taxa_conversao` conforme `[specs/fase-1-paginas-piloto.break.md](../../../specs/fase-1-paginas-piloto.break.md)`.

## Entradas / saídas

**Entradas**: break § data-model/07–10, `references/data_model.md` (se existir seção web), Supabase projeto IdeiaPages.

**Saídas**: migrations numeradas após a última do research; tipos TS atualizados; smoke tests documentados em `web/README.md` ou issue.

## Critérios de aceitação

- [ ] Quatro tabelas criadas com RLS e policies explícitas.
- [ ] `paginas`: leitura pública só para `publicado`; rascunho invisível para `anon`.
- [ ] `leads`: nenhum select/insert client direto; apenas backend.
- [ ] Trigger de variação `controle` ao criar página.
- [ ] Índices: `slug`, `status`, `termo_id` em `paginas`; único `(pagina_id, data)` em `metricas_diarias`.
- [ ] Tipos TS regenerados sem erros de build.
- [ ] Smoke: insert página rascunho + publicar + lead via service_role.

## Não-objetivos

- Auth de operador no Supabase (fora do escopo deste contract).
- Dashboard que popula `metricas_diarias` automaticamente (Fase 3+; na Fase 1 pode ser manual ou stub).
- Particionamento e replicas.

## Referências

- Spec: `specs/fase-1-paginas-piloto.md`
- Break: `specs/fase-1-paginas-piloto.break.md` (issues 07–10, types-update)
