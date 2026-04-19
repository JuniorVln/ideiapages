"""CLI principal — Typer.

Cada subcomando é um behavior do módulo de pesquisa.
Implementações mora em ideiapages_research.behaviors.<behavior>.

Os comandos abaixo são stubs — serão preenchidos pelo agente
python-collector-writer / python-analyzer-writer conforme cada
issue do behavior é executada.
"""

from __future__ import annotations

import typer

app = typer.Typer(
    name="ideiapages-research",
    help="Coleta e análise de termos de busca para IDeiaPages.",
    no_args_is_help=True,
)


@app.command("collect-autocomplete")
def collect_autocomplete(
    seed: str = typer.Option(..., "--seed", "-s", help="Termo-semente"),
    limit: int = typer.Option(50, "--limit", "-l", min=1, max=500),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Coleta autocomplete + People Also Ask para um seed."""
    typer.echo("[stub] collect-autocomplete sera implementado pelo agente python-collector-writer")
    typer.echo(f"  seed={seed} limit={limit} dry_run={dry_run}")


@app.command("collect-serp")
def collect_serp(
    termo_id: str = typer.Option(..., "--termo-id"),
    top: int = typer.Option(10, "--top", min=1, max=50),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Snapshot SERP top N para um termo."""
    typer.echo("[stub] collect-serp")
    typer.echo(f"  termo_id={termo_id} top={top} dry_run={dry_run}")


@app.command("scrape-competitors")
def scrape_competitors(
    termo_id: str = typer.Option(..., "--termo-id"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Raspa conteudo dos top concorrentes."""
    typer.echo("[stub] scrape-competitors")
    typer.echo(f"  termo_id={termo_id} dry_run={dry_run}")


@app.command("collect-trends")
def collect_trends(
    keyword: str = typer.Option(..., "--keyword", "-k"),
    geo: str = typer.Option("BR", "--geo"),
    timeframe: str = typer.Option("today 12-m", "--timeframe"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Busca tendencia Google Trends via pytrends."""
    typer.echo("[stub] collect-trends")
    typer.echo(f"  keyword={keyword} geo={geo} timeframe={timeframe}")


@app.command("classify-terms")
def classify_terms(
    batch_size: int = typer.Option(50, "--batch-size", min=1, max=200),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Classifica termos pendentes via Claude."""
    typer.echo("[stub] classify-terms")
    typer.echo(f"  batch_size={batch_size} dry_run={dry_run}")


@app.command("analyze-gaps")
def analyze_gaps(
    termo_id: str = typer.Option(..., "--termo-id"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Analisa gaps de conteudo (Information Gain) vs concorrentes."""
    typer.echo("[stub] analyze-gaps")
    typer.echo(f"  termo_id={termo_id} dry_run={dry_run}")


@app.command("run-pipeline")
def run_pipeline(
    seed_file: str = typer.Option(..., "--seed-file"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Pipeline completa: collect -> classify -> analyze para todos os seeds."""
    typer.echo("[stub] run-pipeline")
    typer.echo(f"  seed_file={seed_file} dry_run={dry_run}")


if __name__ == "__main__":
    app()
