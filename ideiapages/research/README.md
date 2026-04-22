# IDeiaPages — Research Module

Scripts Python para coleta e análise de termos de busca.

**Status macro do projeto** (sempre atualizado): [`../ROADMAP.md`](../ROADMAP.md).

## Setup

```bash
cd ideiapages/research
uv sync --all-extras
```

Ou com pip:

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -e ".[dev]"
```

## Configuração

Copiar `.env.example` da raiz do `ideiapages/` para `.env` da raiz, com:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `APIFY_TOKEN`
- `FIRECRAWL_API_KEY`
- `ANTHROPIC_API_KEY`

## Comandos disponíveis

```bash
# Listar comandos
uv run ideiapages-research --help

# Onde estou no funil? (contagens Supabase + próximos comandos)
uv run ideiapages-research fase-0-status

# Coletar autocomplete + PAA para um seed
uv run ideiapages-research collect-autocomplete --seed "atendimento whatsapp"

# Priorizar termos classificados (score ≥ 7, exclui tendência decrescente)
uv run ideiapages-research prioritize-terms --limit 50
uv run ideiapages-research prioritize-terms --dry-run

# Snapshot SERP top 10 (Apify) — um termo ou lote priorizado
uv run ideiapages-research collect-serp --termo-id <uuid>
uv run ideiapages-research collect-serp --keyword "atendimento whatsapp"
uv run ideiapages-research collect-serp --all-priorizados --limit 30 --top-n 10
# Se ainda não marcou priorizado: incluir analisados com bom score
uv run ideiapages-research collect-serp --all-priorizados --include-analisado --limit 30

# Raspar concorrentes (Firecrawl) — grupo SERP mais recente do termo
uv run ideiapages-research scrape-competitors --termo-id <uuid>
uv run ideiapages-research scrape-competitors --snapshot-id <uuid-linha-serp>
uv run ideiapages-research scrape-competitors --all-pending --limit 20

# Buscar tendências Google Trends para uma keyword
uv run ideiapages-research collect-trends --keyword "atendimento whatsapp"

# Classificar termos pendentes via Claude
uv run ideiapages-research classify-terms --batch-size 50

# Análise de gaps de conteúdo
uv run ideiapages-research analyze-gaps --termo-id <uuid>

# Fase 0 ponta a ponta (custo alto: confirme o estimador ou use --yes)
uv run ideiapages-research run-pipeline --seed-file ../seeds/ideia_chat.json --yes

# Só relatório (snapshot atual do Supabase → research/data/relatorios/)
uv run ideiapages-research report
```

## Estrutura

```
research/
├── pyproject.toml
├── README.md
├── src/
│   └── ideiapages_research/
│       ├── __init__.py
│       ├── cli.py              # Typer CLI
│       ├── settings.py         # Pydantic Settings
│       ├── clients/            # SDKs encapsulados
│       │   ├── apify.py
│       │   ├── firecrawl.py
│       │   ├── pytrends_client.py
│       │   └── supabase.py
│       ├── llm/                # Wrappers LLMs
│       │   ├── claude.py
│       │   └── prompts/
│       ├── types/              # Pydantic models compartilhados
│       │   ├── term.py
│       │   ├── serp.py
│       │   └── content.py
│       └── behaviors/          # Implementação por behavior
│           ├── collect_autocomplete/
│           ├── collect_serp/
│           ├── scrape_competitors/
│           ├── collect_trends/
│           ├── classify_terms/
│           ├── analyze_gaps/
│           └── pipeline/
└── tests/
    └── behaviors/...
```

## Princípios

- **Type hints estritos** — `mypy --strict`
- **Validação com Pydantic v2** em toda entrada/saída externa
- **Async** quando há I/O
- **Idempotente**: rodar 2x não duplica
- **Dry-run** sempre disponível para testar sem custo
- **Logs estruturados** (JSON em prod, legível em dev)
