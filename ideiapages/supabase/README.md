# Supabase

Migrations versionadas + RLS policies do projeto IDeiaPages.

## Estrutura

```
supabase/
├── migrations/
│   ├── 0001_*.sql
│   ├── 0002_*.sql
│   └── ...
└── README.md
```

## Convenções

- Numeração: `NNNN_<descricao_snake_case>.sql`, zero-padded 4 dígitos
- Forward-only (sem rollback). Para reverter, criar nova migration.
- Toda tabela tem RLS ativada e pelo menos 1 policy explícita
- Author tag no header do arquivo (qual agente criou)

## Como aplicar localmente

Opção A — via Supabase CLI (recomendado):

```bash
# Linkar com projeto remoto
supabase link --project-ref <REF>

# Aplicar migrations
supabase db push
```

Opção B — manual via SQL Editor do dashboard:
abrir o arquivo, copiar SQL, rodar no SQL Editor do dashboard.

## Como gerar tipos TypeScript

```bash
cd ../web
pnpm db:types
```

Isso atualiza `web/src/lib/database.types.ts`.

## Migrations planejadas

As migrations serão criadas pelo agente `model-writer` durante a Fase 0:

| # | Nome | Behavior |
|---|------|----------|
| 0001 | research_tables | research/* (termos, serp_snapshots, conteudo_concorrente) |
| 0002 | pages_tables | rendering/* (paginas, variacoes) |
| 0003 | leads_table | conversion/lead-form-submit |
| 0004 | metrics_table | monitoring/* (metricas_diarias) |
| 0005 | triggers | shared (set_updated_at) |
