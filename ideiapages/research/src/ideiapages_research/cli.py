"""CLI principal — Typer.

Cada subcomando é um behavior do módulo de pesquisa.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
import traceback
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, cast
from uuid import UUID

import typer
from pydantic import BaseModel, Field, ValidationError
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TaskProgressColumn, TextColumn
from rich.table import Table

from ideiapages_research.behaviors.analyze_gaps.analyzer import (
    analyze_gaps_for_term,
    fetch_term_rows_scraped,
)
from ideiapages_research.behaviors.classify_terms.classifier import (
    classify_batch,
    fetch_terms_for_classify,
    load_product_facts,
    load_prompt_bundle,
)
from ideiapages_research.behaviors.collect_autocomplete.collector import (
    collect_for_seed,
    has_recent_collect_for_seed,
)
from ideiapages_research.behaviors.collect_serp.collector import (
    log_metricas_serp,
    snapshot_serp_for_term,
)
from ideiapages_research.behaviors.collect_trends.analyzer import (
    analyze_and_persist,
    should_skip_trend_refresh,
)
from ideiapages_research.behaviors.collect_trends.runner import (
    ensure_term_manual_trends,
    iter_analisado_trend_candidates,
    log_metricas_coleta,
)
from ideiapages_research.behaviors.pipeline.report import write_fase_zero_report
from ideiapages_research.behaviors.pipeline.runner import (
    auto_prioritize_terms,
    run_fase_zero_pipeline,
)
from ideiapages_research.behaviors.pipeline.status import (
    fetch_fase_zero_metrics,
    suggest_fase_zero_steps,
)
from ideiapages_research.behaviors.scrape_competitors.scraper import (
    load_serp_group_by_anchor,
    load_serp_group_latest_termo,
    scrape_competitors_for_serp_rows,
)
from ideiapages_research.clients.pytrends_client import PyTrendsBannedError, PyTrendsClient
from ideiapages_research.clients.supabase import get_supabase
from ideiapages_research.settings import PROJECT_ROOT, get_settings
from ideiapages_research.text import normalize_keyword

app = typer.Typer(
    name="ideiapages-research",
    help="Coleta e análise de termos de busca para IDeiaPages.",
    no_args_is_help=True,
)

import sys as _sys
console = Console(
    # Force UTF-8 on Windows (cmd.exe usa CP-1252 por padrão e quebra com →, →, etc.)
    file=open(_sys.stdout.fileno(), mode="w", encoding="utf-8", buffering=1, closefd=False)
    if _sys.platform == "win32" and hasattr(_sys.stdout, "fileno")
    else None,
    highlight=False,
)


class SeedFileSchema(BaseModel):
    """Schema mínimo de arquivos tipo ``seeds/ideia_chat.json``."""

    seeds_termos: list[str] = Field(..., min_length=1)


def _logs_dir() -> Path:
    d = PROJECT_ROOT / "research" / "data" / "logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _append_jsonl(path: Path, obj: dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


@app.command("collect-autocomplete")
def collect_autocomplete_cmd(
    seed: str | None = typer.Option(
        None,
        "--seed",
        "-s",
        help="Seed único (mutuamente exclusivo com --seed-file).",
    ),
    seed_file: Path | None = typer.Option(
        None,
        "--seed-file",
        "-f",
        help="JSON com campo seeds_termos (ex.: seeds/ideia_chat.json).",
    ),
    limit: int = typer.Option(50, "--limit", "-l", min=1, max=500),
    geo: str = typer.Option("BR", "--geo"),
    lang: str = typer.Option("pt-BR", "--lang"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Chama Apify mas não grava Supabase."),
    force: bool = typer.Option(False, "--force", help="Ignora cache de 7 dias."),
    pause_seconds: float = typer.Option(2.0, "--pause-seconds", min=0.0),
    max_seeds: int | None = typer.Option(
        None,
        "--max-seeds",
        min=1,
        help="Processa no máximo N seeds do arquivo (útil em testes).",
    ),
    no_input: bool = typer.Option(
        False,
        "--no-input",
        help="Sem prompts: se houver cache recente, pula o seed.",
    ),
) -> None:
    """Coleta autocomplete + PAA (Apify) e persiste em ``termos``."""
    if bool(seed) == bool(seed_file):
        console.print("[red]Informe exatamente um: --seed ou --seed-file.[/red]")
        raise typer.Exit(code=2)

    seeds: list[str]
    if seed:
        seeds = [seed.strip()]
    else:
        assert seed_file is not None
        path = seed_file if seed_file.is_absolute() else (PROJECT_ROOT / seed_file)
        if not path.is_file():
            console.print(f"[red]Arquivo não encontrado: {path}[/red]")
            raise typer.Exit(code=2)
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            parsed = SeedFileSchema.model_validate(raw)
        except (json.JSONDecodeError, ValidationError) as e:
            console.print(f"[red]JSON inválido: {e}[/red]")
            raise typer.Exit(code=2) from e
        seeds = [s.strip() for s in parsed.seeds_termos if s.strip()]

    if max_seeds is not None:
        seeds = seeds[:max_seeds]

    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = _logs_dir() / f"collect-autocomplete-{ts}.jsonl"

    totals = {
        "seeds_total": len(seeds),
        "seeds_ok": 0,
        "seeds_failed": 0,
        "skipped_cache": 0,
        "inserted": 0,
        "already_existed": 0,
        "discarded": 0,
        "cost_brl": 0.0,
    }
    failures: list[tuple[str, str]] = []

    for i, s in enumerate(seeds):
        force_this = force
        if not force_this and not dry_run and has_recent_collect_for_seed(s):
            if no_input:
                console.print(f"[yellow]Pulando (cache recente, --no-input): {s!r}[/yellow]")
                totals["skipped_cache"] += 1
                _append_jsonl(
                    log_path,
                    {"seed": s, "event": "skipped_cache", "index": i},
                )
                continue
            if not typer.confirm(
                f"Coleta recente (<7d) para {s!r}. Deseja continuar e gastar crédito Apify?",
                default=False,
            ):
                console.print(f"[yellow]Pulando por cache: {s!r}[/yellow]")
                totals["skipped_cache"] += 1
                _append_jsonl(
                    log_path,
                    {"seed": s, "event": "skipped_user", "index": i},
                )
                continue
            force_this = True

        try:
            report = collect_for_seed(
                s,
                limit=limit,
                geo=geo,
                lang=lang,
                dry_run=dry_run,
                force=force_this,
            )
        except Exception as e:
            totals["seeds_failed"] += 1
            msg = f"{e}"
            failures.append((s, msg))
            console.print(f"[red]Falha em {s!r}: {msg}[/red]")
            if console.is_terminal:
                console.print(traceback.format_exc())
            _append_jsonl(
                log_path,
                {
                    "seed": s,
                    "event": "error",
                    "index": i,
                    "error": msg,
                },
            )
        else:
            if report.error:
                totals["seeds_failed"] += 1
                failures.append((s, report.error))
                console.print(f"[red]Seed inválido {s!r}: {report.error}[/red]")
                _append_jsonl(
                    log_path,
                    {"seed": s, "event": "invalid", "index": i, "error": report.error},
                )
                continue
            if report.skipped_due_to_cache:
                totals["skipped_cache"] += 1
                _append_jsonl(
                    log_path,
                    {"seed": s, "event": "skipped_internal_cache", "index": i},
                )
                continue

            totals["seeds_ok"] += 1
            totals["inserted"] += report.inserted
            totals["already_existed"] += report.already_existed
            totals["discarded"] += report.discarded
            totals["cost_brl"] += float(report.estimated_cost_brl)
            _append_jsonl(
                log_path,
                {
                    "seed": s,
                    "event": "ok",
                    "index": i,
                    "report": report.model_dump(),
                },
            )
            console.print(
                f"[green]OK[/green] {s!r} — "
                f"+{report.inserted} novos, ={report.already_existed} existentes, "
                f"-{report.discarded} descartados, "
                f"custo ~R$ {report.estimated_cost_brl:.4f}"
                + (" [dim](dry-run)[/dim]" if dry_run else "")
            )

        if i < len(seeds) - 1 and pause_seconds > 0:
            time.sleep(pause_seconds)

    table = Table(title="Resumo collect-autocomplete", show_header=True, header_style="bold")
    table.add_column("Métrica")
    table.add_column("Valor", justify="right")
    for k, v in totals.items():
        if k == "cost_brl":
            table.add_row(k, f"{v:.4f}")
        else:
            table.add_row(k, str(v))
    console.print(table)
    console.print(f"Log JSONL: [cyan]{log_path}[/cyan]")

    if failures:
        console.print("[red]Falhas:[/red]")
        for s, msg in failures:
            console.print(f"  - {s!r}: {msg}")
        raise typer.Exit(code=1)


@app.command("prioritize-terms")
def prioritize_terms_cmd(
    min_score: int = typer.Option(
        7,
        "--min-score",
        min=1,
        max=10,
        help="Somente termos analisados com score >= este valor.",
    ),
    limit: int = typer.Option(
        50,
        "--limit",
        min=1,
        max=500,
        help="Máximo de termos a promover para priorizado (ordem: score desc).",
    ),
    keep_decrescente: bool = typer.Option(
        False,
        "--keep-decrescente",
        help="Inclui termos cuja tendência (pytrends) está decrescente.",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Mostra quantos seriam priorizados, sem atualizar o Supabase.",
    ),
) -> None:
    """Promove ``analisado`` → ``priorizado`` (pré-requisito típico antes do collect-serp em lote).

    Depois rode: ``collect-serp --all-priorizados --limit N --top-n 10``
    """
    sb = get_supabase()
    n = auto_prioritize_terms(
        sb,
        min_score=min_score,
        limit=limit,
        exclude_decrescente=not keep_decrescente,
        dry_run=dry_run,
    )
    if dry_run:
        console.print(f"[cyan]Dry-run:[/cyan] {n} termo(s) seriam priorizados.")
    else:
        console.print(f"[green]Priorizados:[/green] {n} termo(s).")


@app.command("collect-serp")
def collect_serp_cmd(
    termo_id: str | None = typer.Option(None, "--termo-id", help="UUID do termo (modo unico)."),
    keyword: str | None = typer.Option(
        None,
        "--keyword",
        "-k",
        help="Keyword exata como esta em ``termos.keyword`` (modo unico).",
    ),
    all_priorizados: bool = typer.Option(
        False,
        "--all-priorizados",
        help="Processa lote: termos com status=priorizado (e opcionalmente analisado).",
    ),
    include_analisado: bool = typer.Option(
        False,
        "--include-analisado",
        help="No lote, inclui tambem status=analisado.",
    ),
    top_n: int = typer.Option(10, "--top-n", min=1, max=50),
    limit: int = typer.Option(30, "--limit", min=1, max=50),
    pause_seconds: float = typer.Option(3.0, "--pause-seconds", min=0.0),
    dry_run: bool = typer.Option(False, "--dry-run"),
    force: bool = typer.Option(
        False,
        "--force",
        help="Ignora cache de snapshot (serp_cache_days).",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Pula confirmacao de custo estimado no lote.",
    ),
    geo: str = typer.Option("BR", "--geo"),
    lang: str = typer.Option("pt-BR", "--lang"),
) -> None:
    """Snapshot SERP (Google) top N via Apify para um termo ou lote priorizado."""
    modes = sum([bool(termo_id), bool(keyword), all_priorizados])
    if modes != 1:
        console.print(
            "[red]Informe exatamente um modo: --termo-id, --keyword ou --all-priorizados.[/red]"
        )
        raise typer.Exit(code=2)

    settings = get_settings()
    sb = get_supabase()
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = _logs_dir() / f"collect-serp-{ts}.jsonl"

    def _log(event: dict[str, Any]) -> None:
        _append_jsonl(log_path, event)

    rows_to_run: list[dict[str, Any]]
    if all_priorizados:
        stat_list = ["priorizado"]
        if include_analisado:
            stat_list.append("analisado")
        q = (
            sb.table("termos")
            .select("id,keyword,status")
            .in_("status", stat_list)
            .order("updated_at", desc=False)
            .limit(limit)
            .execute()
        )
        rows_to_run = list(q.data or [])
        if not rows_to_run:
            console.print("[yellow]Nenhum termo no lote (status / limite).[/yellow]")
            raise typer.Exit(code=0)
        est_per = 0.10
        est_total = est_per * len(rows_to_run)
        if (
            est_total >= float(settings.serp_batch_cost_confirm_brl)
            and not yes
            and not settings.skip_cost_confirm
            and not dry_run
            and not typer.confirm(
                f"[yellow]Custo estimado do lote ~R$ {est_total:.2f} "
                f"({len(rows_to_run)} termos). Continuar?[/yellow]",
                default=False,
            )
        ):
            raise typer.Exit(code=0)
    else:
        if termo_id:
            try:
                tid = UUID(termo_id.strip())
            except ValueError:
                console.print("[red]--termo-id invalido (UUID).[/red]")
                raise typer.Exit(code=2) from None
            q = (
                sb.table("termos")
                .select("id,keyword,status")
                .eq("id", str(tid))
                .limit(1)
                .execute()
            )
        else:
            kw = normalize_keyword(keyword or "")
            if len(kw) < 2:
                console.print("[red]Keyword invalida.[/red]")
                raise typer.Exit(code=2)
            q = (
                sb.table("termos")
                .select("id,keyword,status")
                .eq("keyword", kw)
                .limit(1)
                .execute()
            )
        if not q.data:
            console.print("[red]Termo nao encontrado.[/red]")
            raise typer.Exit(code=2)
        rows_to_run = [q.data[0]]

    total_cost = 0.0
    ok_n = 0
    fail_n = 0
    skipped = 0
    zero_results = 0
    inserted_n = 0

    for i, row in enumerate(rows_to_run):
        tid = UUID(str(row["id"]))
        kw = str(row["keyword"])
        st = str(row["status"])
        try:
            rep = snapshot_serp_for_term(
                termo_id=tid,
                keyword=kw,
                status=st,
                top_n=top_n,
                geo=geo,
                lang=lang,
                dry_run=dry_run,
                force=force,
                sb=sb,
                settings=settings,
            )
        except Exception as e:
            fail_n += 1
            console.print(f"[red]Falha {kw!r}: {e}[/red]")
            _log({"event": "error", "keyword": kw, "termo_id": str(tid), "error": str(e)})
            if i < len(rows_to_run) - 1 and pause_seconds > 0:
                time.sleep(pause_seconds)
            continue

        if rep.skipped_cache:
            skipped += 1
        else:
            total_cost += rep.estimated_cost_brl
        if rep.rows_inserted > 0:
            inserted_n += 1
        if rep.rows_inserted == 0 and not rep.skipped_cache:
            zero_results += 1
        if rep.warnings:
            for w in rep.warnings:
                console.print(f"[yellow]{kw!r}: {w}[/yellow]")
        ok_n += 1
        _log(
            {
                "event": "ok" if rep.rows_inserted else "empty",
                "keyword": kw,
                "termo_id": str(tid),
                "report": rep.model_dump(mode="json"),
                "dry_run": dry_run,
            }
        )
        console.print(
            f"[green]OK[/green] {kw!r} — {rep.rows_inserted} linhas, "
            f"custo ~R$ {rep.estimated_cost_brl:.4f}"
            + (" [dim](cache)[/dim]" if rep.skipped_cache else "")
            + (" [dim](dry-run)[/dim]" if dry_run else "")
        )
        if rep.raw_path:
            console.print(f"  raw: [cyan]{rep.raw_path}[/cyan]")

        if i < len(rows_to_run) - 1 and pause_seconds > 0:
            time.sleep(pause_seconds)

    table = Table(title="Resumo collect-serp", show_header=True, header_style="bold")
    for k, v in [
        ("termos_no_lote", len(rows_to_run)),
        ("execucoes_ok", ok_n),
        ("falhas", fail_n),
        ("cache_skip", skipped),
        ("sem_resultado_apos_coleta", zero_results),
        ("custo_total_estimado_brl", f"{total_cost:.4f}"),
        ("dry_run", dry_run),
    ]:
        table.add_row(k, str(v))
    console.print(table)
    console.print(f"Log JSONL: [cyan]{log_path}[/cyan]")

    if not dry_run and len(rows_to_run) > 0:
        log_metricas_serp(
            {
                "mode": "batch" if all_priorizados else "single",
                "top_n": top_n,
                "geo": geo,
                "lang": lang,
                "force": force,
                "snapshots_com_linhas": inserted_n,
                "cache_skip": skipped,
            },
            items_ok=inserted_n,
            items_fail=fail_n,
            cost=total_cost,
        )

    if fail_n:
        raise typer.Exit(code=1)


@app.command("scrape-competitors")
def scrape_competitors_cmd(
    snapshot_id: str | None = typer.Option(
        None,
        "--snapshot-id",
        help="UUID de qualquer linha ``serp_snapshots`` do lote desejado.",
    ),
    termo_id: str | None = typer.Option(
        None,
        "--termo-id",
        help="UUID do termo — usa o snapshot SERP mais recente.",
    ),
    all_pending: bool = typer.Option(
        False,
        "--all-pending",
        help="Termos com status=snapshot_serp_ok (ate --limit).",
    ),
    top_n: int = typer.Option(10, "--top-n", min=1, max=10),
    max_concurrent: int = typer.Option(3, "--max-concurrent", min=1, max=5),
    limit: int = typer.Option(20, "--limit", min=1, max=100),
    dry_run: bool = typer.Option(False, "--dry-run"),
    force: bool = typer.Option(
        False,
        "--force",
        help="Ignora cache de raspagem (scrape_cache_days).",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Pula confirmacao de custo estimado no lote.",
    ),
    cascade_serp: bool = typer.Option(
        True,
        "--cascade-serp/--no-cascade-serp",
        help="Sem SERP no modo --termo-id: executa collect-serp antes.",
    ),
) -> None:
    """Raspa concorrentes (Firecrawl) a partir do snapshot SERP do termo."""
    modes = sum([bool(snapshot_id), bool(termo_id), all_pending])
    if modes != 1:
        console.print(
            "[red]Informe exatamente um: --snapshot-id, --termo-id ou --all-pending.[/red]"
        )
        raise typer.Exit(code=2)

    settings = get_settings()
    sb = get_supabase()
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = _logs_dir() / f"scrape-competitors-{ts}.jsonl"

    def _append(event: dict[str, Any]) -> None:
        _append_jsonl(log_path, event)

    batch_failures = 0
    groups_run = 0

    def _run_group_sync(rows: list[dict[str, Any]], *, label: str) -> None:
        nonlocal batch_failures, groups_run
        rep = asyncio.run(
            scrape_competitors_for_serp_rows(
                rows,
                top_n=top_n,
                max_concurrent=max_concurrent,
                dry_run=dry_run,
                force=force,
                sb=sb,
                settings=settings,
            )
        )
        groups_run += 1
        batch_failures += rep.scraped_fail
        _append({"event": "batch", "label": label, "report": rep.model_dump(mode="json")})
        console.print(
            f"[green]{label}[/green] termo={rep.termo_id} urls={rep.urls_total} "
            f"ok={rep.scraped_ok} fail={rep.scraped_fail} cache={rep.cache_hits} "
            f"thin={rep.thin} paywalled={rep.paywalled} custo~R$ {rep.cost_brl:.4f}"
            + (" [dim](dry-run)[/dim]" if dry_run else "")
        )
        if rep.errors:
            for e in rep.errors[:5]:
                console.print(f"  [yellow]{e}[/yellow]")

    if all_pending:
        q = (
            sb.table("termos")
            .select("id,keyword,status")
            .eq("status", "snapshot_serp_ok")
            .order("updated_at", desc=False)
            .limit(limit)
            .execute()
        )
        trows = list(q.data or [])
        if not trows:
            console.print("[yellow]Nenhum termo com status=snapshot_serp_ok.[/yellow]")
            raise typer.Exit(code=0)
        est = 0.03 * top_n * len(trows)
        if (
            est >= float(settings.scrape_batch_cost_confirm_brl)
            and not yes
            and not settings.skip_cost_confirm
            and not dry_run
            and not typer.confirm(
                f"[yellow]Custo estimado do lote ~R$ {est:.2f} "
                f"({len(trows)} termos x ~{top_n} URLs). Continuar?[/yellow]",
                default=False,
            )
        ):
            raise typer.Exit(code=0)

        for row in trows:
            tid = UUID(str(row["id"]))
            g = load_serp_group_latest_termo(sb, tid)
            if not g:
                console.print(f"[yellow]Sem SERP para termo {tid}; pulando.[/yellow]")
                continue
            _run_group_sync(g, label=str(row.get("keyword", tid)))
    else:
        serp_rows: list[dict[str, Any]] = []
        if snapshot_id:
            try:
                aid = UUID(snapshot_id.strip())
            except ValueError:
                console.print("[red]--snapshot-id invalido.[/red]")
                raise typer.Exit(code=2) from None
            serp_rows = load_serp_group_by_anchor(sb, aid)
        else:
            assert termo_id is not None
            try:
                tid = UUID(termo_id.strip())
            except ValueError:
                console.print("[red]--termo-id invalido.[/red]")
                raise typer.Exit(code=2) from None
            serp_rows = load_serp_group_latest_termo(sb, tid)
            if not serp_rows and cascade_serp and not dry_run:
                tq = (
                    sb.table("termos")
                    .select("id,keyword,status")
                    .eq("id", str(tid))
                    .limit(1)
                    .execute()
                )
                if not tq.data:
                    console.print("[red]Termo nao encontrado.[/red]")
                    raise typer.Exit(code=2)
                tr = tq.data[0]
                console.print("[cyan]Cascade: executando collect-serp…[/cyan]")
                snapshot_serp_for_term(
                    termo_id=tid,
                    keyword=str(tr["keyword"]),
                    status=str(tr["status"]),
                    top_n=top_n,
                    dry_run=False,
                    force=False,
                    sb=sb,
                    settings=settings,
                )
                serp_rows = load_serp_group_latest_termo(sb, tid)

        if not serp_rows:
            console.print("[red]Nenhuma linha SERP para raspar.[/red]")
            raise typer.Exit(code=2)

        _run_group_sync(serp_rows, label="single")

    table = Table(title="Resumo scrape-competitors", show_header=True, header_style="bold")
    table.add_row("grupos_executados", str(groups_run))
    table.add_row("falhas_url", str(batch_failures))
    table.add_row("dry_run", str(dry_run))
    console.print(table)
    console.print(f"Log JSONL: [cyan]{log_path}[/cyan]")

    if batch_failures:
        raise typer.Exit(code=1)


@app.command("collect-trends")
def collect_trends_cmd(
    keyword: str | None = typer.Option(
        None,
        "--keyword",
        "-k",
        help="Modo único; omita para lote (termos com status=analisado e cache expirado).",
    ),
    geo: str = typer.Option("BR", "--geo"),
    timeframe: str = typer.Option("today 12-m", "--timeframe"),
    limit: int = typer.Option(50, "--limit", "-l", min=1, max=500),
    pause_seconds: float = typer.Option(5.0, "--pause-seconds", min=0.0),
    dry_run: bool = typer.Option(False, "--dry-run"),
    force: bool = typer.Option(False, "--force", help="Ignora cache de tendência (30 dias)."),
) -> None:
    """Google Trends via pytrends (custo R$ 0,00)."""
    settings = get_settings()
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = _logs_dir() / f"collect-trends-{ts}.jsonl"

    stats: dict[str, Any] = {
        "processed": 0,
        "skipped_cache": 0,
        "with_data": 0,
        "no_data": 0,
        "failures": 0,
        "crescente": 0,
        "estavel": 0,
        "decrescente": 0,
    }
    client = PyTrendsClient()
    ban_recovery_used = False

    def _append(event: dict[str, Any]) -> None:
        _append_jsonl(log_path, event)

    def _run_one(term_id_str: str, kw: str, idx: int, total: int) -> bool:
        """Retorna False se ban persistente (lote deve parar)."""
        nonlocal ban_recovery_used
        while True:
            try:
                result = client.fetch(kw, geo=geo, timeframe=timeframe)
                rep = analyze_and_persist(
                    UUID(term_id_str),
                    kw,
                    result,
                    dry_run=dry_run,
                )
                stats["processed"] += 1
                if result is None:
                    stats["no_data"] += 1
                else:
                    stats["with_data"] += 1
                tdir = rep.tendencia
                if tdir in ("crescente", "estavel", "decrescente"):
                    stats[tdir] += 1
                _append(
                    {
                        "event": "ok",
                        "index": idx,
                        "total": total,
                        "keyword": kw,
                        "termo_id": term_id_str,
                        "tendencia": rep.tendencia,
                        "dry_run": dry_run,
                    }
                )
                ban_recovery_used = False
                return True
            except PyTrendsBannedError:
                if ban_recovery_used:
                    stats["failures"] += 1
                    _append(
                        {
                            "event": "banned_abort",
                            "keyword": kw,
                            "index": idx,
                        }
                    )
                    console.print("[red]Ban persistente após espera de 5 min.[/red]")
                    return False
                console.print(
                    "[yellow]Possível ban (429). Aguardando 5 min antes de retentar…[/yellow]"
                )
                time.sleep(300)
                client.reset_consecutive_failures()
                ban_recovery_used = True

    if keyword:
        kw_norm = normalize_keyword(keyword)
        if len(kw_norm) < 2:
            console.print("[red]Keyword inválida.[/red]")
            raise typer.Exit(2)
        try:
            term_id = ensure_term_manual_trends(keyword)
        except Exception as e:
            console.print(f"[red]{e}[/red]")
            raise typer.Exit(2) from e
        sb = get_supabase()
        row = (
            sb.table("termos")
            .select("tendencia_pytrends")
            .eq("id", str(term_id))
            .limit(1)
            .execute()
        )
        tp = (row.data[0].get("tendencia_pytrends") if row.data else None) or None
        tp_d = tp if isinstance(tp, dict) else None
        if should_skip_trend_refresh(
            tp_d,
            force=force,
            cache_days=settings.trend_cache_days,
        ):
            console.print(
                "[cyan]Cache de tendência ainda válido — use --force para refetch.[/cyan]"
            )
            stats["skipped_cache"] += 1
        else:
            try:
                if not _run_one(str(term_id), kw_norm, 0, 1):
                    raise typer.Exit(code=1)
            except typer.Exit:
                raise
            except Exception as e:
                stats["failures"] += 1
                console.print(f"[red]Falha: {e}[/red]")
                _append({"event": "error", "keyword": kw_norm, "error": str(e)})
                raise typer.Exit(1) from e
    else:
        candidates = iter_analisado_trend_candidates(
            limit=limit,
            force=force,
            cache_days=settings.trend_cache_days,
        )
        if not candidates:
            console.print(
                "[yellow]Nenhum termo analisado pendente de tendência (ou cache fresco).[/yellow]"
            )
        total = len(candidates)
        batch_abort = False
        if total > 0:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                console=console,
            ) as progress:
                task = progress.add_task("collect-trends", total=total)
                for i, row in enumerate(candidates):
                    tid = str(row["id"])
                    kw = str(row["keyword"])
                    try:
                        if not _run_one(tid, kw, i, total):
                            batch_abort = True
                            progress.advance(task)
                            break
                    except Exception as e:
                        stats["failures"] += 1
                        console.print(f"[red]Falha em {kw!r}: {e}[/red]")
                        _append({"event": "error", "keyword": kw, "error": str(e)})
                    progress.advance(task)
                    if i < total - 1 and pause_seconds > 0:
                        time.sleep(pause_seconds)
            if batch_abort:
                console.print("[yellow]Lote interrompido após ban persistente (veja log).[/yellow]")

    table = Table(
        title="Resumo collect-trends (custo R$ 0,00)",
        show_header=True,
        header_style="bold",
    )
    for k, v in stats.items():
        table.add_row(k, str(v))
    console.print(table)
    console.print(f"Log JSONL: [cyan]{log_path}[/cyan]")

    if not dry_run and stats["processed"] > 0:
        log_metricas_coleta(
            {
                "mode": "single" if keyword else "batch",
                "stats": stats,
                "geo": geo,
                "timeframe": timeframe,
            },
            items_ok=stats["processed"],
            items_fail=stats["failures"],
        )

    if stats["failures"] and not keyword:
        raise typer.Exit(code=1)


@app.command("classify-terms")
def classify_terms(
    batch_size: int = typer.Option(
        50,
        "--batch-size",
        min=1,
        max=200,
        help="Termos por chamada ao Claude (recomendado ate 50).",
    ),
    max_batches: int = typer.Option(
        10,
        "--max-batches",
        min=1,
        max=500,
        help="Limite de lotes por execução (proteção de custo).",
    ),
    prompt_version: int | None = typer.Option(
        None,
        "--prompt-version",
        min=1,
        help="Deve coincidir com o campo version do frontmatter do prompt em disco.",
    ),
    reclassify: bool = typer.Option(
        False,
        "--reclassify",
        help="Inclui termos já classificados (status coletado ou analisado) para sobrescrever.",
    ),
    where: str | None = typer.Option(
        None,
        "--where",
        help="Reservado para filtro avançado; não suportado nesta versão.",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Chama o modelo e valida o JSON, sem gravar Supabase.",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Pula confirmações (--reclassify e alerta de custo > limiar).",
    ),
) -> None:
    """Classifica termos pendentes via Claude Haiku (prompt versionado).

    Exemplo: ``ideiapages-research classify-terms --batch-size 50 --max-batches 4``
    """
    if where:
        console.print("[red]--where ainda não é suportado; remova o argumento.[/red]")
        raise typer.Exit(code=2)

    settings = get_settings()
    if reclassify and not yes and not typer.confirm(
        "[yellow]--reclassify pode reprocessar muitos termos e gerar custo. "
        "Continuar?[/yellow]",
        default=False,
    ):
        raise typer.Exit(code=0)

    try:
        facts = load_product_facts()
        bundle = load_prompt_bundle(prompt_version=prompt_version)
    except (FileNotFoundError, ValueError) as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(code=2) from e

    total_cap = batch_size * max_batches
    sb = get_supabase()
    rows = fetch_terms_for_classify(sb, reclassify=reclassify, limit=total_cap)
    if not rows:
        console.print("[yellow]Nenhum termo pendente para classificar.[/yellow]")
        raise typer.Exit(code=0)

    chunks: list[list[dict[str, Any]]] = [
        rows[i : i + batch_size] for i in range(0, len(rows), batch_size)
    ]

    log_path = _logs_dir() / f"classify_terms_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.jsonl"
    skip_confirm = bool(settings.skip_cost_confirm or yes)
    alert_brl = float(settings.classify_cost_alert_brl)

    cumulative_cost = 0.0
    total_ok = 0
    total_fail = 0
    batches_run = 0
    score_hist: dict[int, int] = dict.fromkeys(range(1, 11), 0)
    cluster_totals: dict[str, int] = {}

    for i, chunk in enumerate(chunks):
        if (
            i > 0
            and cumulative_cost >= alert_brl
            and not skip_confirm
            and not typer.confirm(
                f"[yellow]Custo acumulado ~R$ {cumulative_cost:.2f} "
                f"(limiar R$ {alert_brl:.2f}). "
                "Continuar com os lotes restantes?[/yellow]",
                default=False,
            )
        ):
            _append_jsonl(
                log_path,
                {
                    "event": "stopped_by_cost_confirm",
                    "batches_done": i,
                    "cost_brl": cumulative_cost,
                },
            )
            break

        res = classify_batch(
            chunk,
            product_facts=facts,
            bundle=bundle,
            dry_run=dry_run,
            sb=None if dry_run else sb,
            settings=settings,
            batch_index=i,
        )
        cumulative_cost += res.cost_brl
        total_ok += res.succeeded
        total_fail += res.failed
        batches_run += 1
        for s, n in res.score_histogram.items():
            if 1 <= s <= 10:
                score_hist[s] = score_hist.get(s, 0) + n
        for c, n in res.cluster_top.items():
            cluster_totals[c] = cluster_totals.get(c, 0) + n

        _append_jsonl(
            log_path,
            {
                "event": "batch_done",
                "batch_index": i,
                "processed": res.processed,
                "succeeded": res.succeeded,
                "failed": res.failed,
                "cost_brl": res.cost_brl,
                "errors": res.errors,
                "dry_run": dry_run,
                "reclassify": reclassify,
            },
        )

    hist_table = Table(
        title="Histograma score_conversao (1-10)",
        show_header=True,
        header_style="bold",
    )
    hist_table.add_column("Score")
    hist_table.add_column("Termos")
    for s in range(1, 11):
        hist_table.add_row(str(s), str(score_hist.get(s, 0)))
    console.print(hist_table)

    top_clusters = sorted(cluster_totals.items(), key=lambda x: -x[1])[:5]
    ct = Table(title="Top 5 clusters", show_header=True, header_style="bold")
    ct.add_column("Cluster")
    ct.add_column("Termos")
    for name, n in top_clusters:
        ct.add_row(name, str(n))
    console.print(ct)

    sum_table = Table(title="Resumo classify-terms", show_header=True, header_style="bold")
    for k, v in [
        ("termos_carregados", len(rows)),
        ("lotes_executados", batches_run),
        ("sucesso", total_ok),
        ("falhas", total_fail),
        ("custo_total_brl", f"{cumulative_cost:.4f}"),
        ("dry_run", dry_run),
        ("modelo", settings.classify_model),
        ("prompt_version", bundle.version),
    ]:
        sum_table.add_row(k, str(v))
    console.print(sum_table)
    console.print(f"Log JSONL: [cyan]{log_path}[/cyan]")

    if total_fail and not dry_run:
        raise typer.Exit(code=1)


@app.command("analyze-gaps")
def analyze_gaps_cmd(
    termo_id: str | None = typer.Option(
        None,
        "--termo-id",
        help="UUID de um termo. Mutuamente exclusivo com --all-scraped.",
    ),
    all_scraped: bool = typer.Option(
        False,
        "--all-scraped",
        help="Lote: termos com status=scraped (cuidado: custo ~Sonnet por termo).",
    ),
    limit: int = typer.Option(
        20,
        "--limit",
        min=1,
        max=100,
        help="Máximo de termos no lote (--all-scraped).",
    ),
    top_n: int = typer.Option(
        10,
        "--top-n",
        min=1,
        max=10,
        help="Concorrentes no prompt (após filtrar thin/paywall).",
    ),
    prompt_version: int | None = typer.Option(
        None,
        "--prompt-version",
        min=1,
        help="Deve coincidir com version no frontmatter de analyze-gaps.md.",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Chama Claude e valida JSON; não grava briefings_seo nem atualiza status.",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        help="Ignora cache de briefing recente (analyze_gaps_cache_days).",
    ),
    pause_seconds: float | None = typer.Option(
        None,
        "--pause-seconds",
        min=0.0,
        help="Pausa entre termos no lote (default: settings.analyze_gaps_pause_seconds).",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Pula confirmação quando o custo estimado do lote é alto.",
    ),
) -> None:
    """Gera briefing SEO (gaps / Information Gain) com Claude Sonnet.

    **Custo**: esta é a etapa mais cara do pipeline (tokens de entrada grandes).
    Exemplo: ``ideiapages-research analyze-gaps --all-scraped --limit 20 --top-n 10``
    """
    if bool(termo_id) == bool(all_scraped):
        console.print(
            "[red]Informe exatamente um modo: --termo-id OU --all-scraped.[/red]"
        )
        raise typer.Exit(code=2)

    settings = get_settings()
    pause = (
        settings.analyze_gaps_pause_seconds
        if pause_seconds is None
        else pause_seconds
    )
    skip_confirm = bool(
        settings.skip_cost_confirm
        or yes
        or os.getenv("CONFIRM_HIGH_COST", "").lower() in ("1", "true", "yes")
    )

    try:
        from ideiapages_research.behaviors.classify_terms.classifier import (  # noqa: PLC0415
            load_prompt_bundle,
        )

        bundle = load_prompt_bundle(
            PROJECT_ROOT / "references" / "prompts" / "analyze-gaps.md",
            prompt_version=prompt_version,
        )
    except (FileNotFoundError, ValueError) as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(code=2) from e

    sb = get_supabase()
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log_path = _logs_dir() / f"analyze-gaps-{ts}.jsonl"

    rows: list[dict[str, Any]]
    if termo_id:
        try:
            tid = UUID(termo_id.strip())
        except ValueError:
            console.print("[red]--termo-id inválido.[/red]")
            raise typer.Exit(code=2) from None
        tq = (
            sb.table("termos")
            .select(
                "id,keyword,status,intencao,score_conversao,cluster,tipo_pagina_recomendado"
            )
            .eq("id", str(tid))
            .limit(1)
            .execute()
        )
        if not tq.data:
            console.print("[red]Termo não encontrado.[/red]")
            raise typer.Exit(code=2)
        rows = [cast(dict[str, Any], tq.data[0])]
    else:
        rows = fetch_term_rows_scraped(sb, limit=limit)
        if not rows:
            console.print("[yellow]Nenhum termo com status=scraped.[/yellow]")
            raise typer.Exit(code=0)

    n = len(rows)
    est = round(n * float(settings.analyze_gaps_cost_per_term_estimate_brl), 2)
    thr = float(settings.analyze_gaps_batch_confirm_brl)
    console.print(
        f"[cyan]analyze-gaps[/cyan]: {n} termo(s); custo estimado ~R$ {est:.2f} "
        f"(teto conservador; modelo {settings.analyze_gaps_model})."
    )
    if (
        n > 1
        and est >= thr
        and not skip_confirm
        and not typer.confirm(
            f"[yellow]Estimativa ≥ R$ {thr:.2f}. Continuar?[/yellow]",
            default=False,
        )
    ):
        raise typer.Exit(code=0)

    ok_n = 0
    skip_n = 0
    fail_n = 0
    cost_total = 0.0
    word_targets: list[int] = []
    alerts_all: list[str] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("analyze-gaps", total=n)
        for i, row in enumerate(rows):
            tid = UUID(str(row["id"]))
            rep = analyze_gaps_for_term(
                sb,
                tid,
                keyword=str(row["keyword"]),
                intencao=row.get("intencao"),
                score_conversao=row.get("score_conversao"),
                cluster=row.get("cluster"),
                tipo_pagina=row.get("tipo_pagina_recomendado"),
                prompt_version=prompt_version,
                top_n=top_n,
                dry_run=dry_run,
                force=force,
                settings=settings,
            )
            cost_total += rep.cost_brl
            ev = {
                "event": "term_done",
                "index": i,
                "total": n,
                "termo_id": str(tid),
                "keyword": row.get("keyword"),
                "ok": rep.ok,
                "skipped_cache": rep.skipped_cache,
                "cost_brl": rep.cost_brl,
                "error": rep.error,
                "dry_run": dry_run,
            }
            _append_jsonl(log_path, ev)

            if rep.skipped_cache:
                skip_n += 1
            elif rep.ok:
                ok_n += 1
                if rep.briefing:
                    word_targets.append(rep.briefing.word_count_alvo)
                    alerts_all.extend(rep.briefing.alertas_para_humano[:5])
            else:
                fail_n += 1

            progress.advance(task)
            if i < n - 1 and pause > 0:
                time.sleep(pause)

    def _hist(values: list[int]) -> str:
        if not values:
            return "(nenhum briefing novo)"
        buckets = {"<1200": 0, "1200-1999": 0, "2000-2999": 0, "3000+": 0}
        for w in values:
            if w < 1200:
                buckets["<1200"] += 1
            elif w < 2000:
                buckets["1200-1999"] += 1
            elif w < 3000:
                buckets["2000-2999"] += 1
            else:
                buckets["3000+"] += 1
        return ", ".join(f"{k}={v}" for k, v in buckets.items())

    top_alerts = alerts_all[:15]
    tbl = Table(title="Resumo analyze-gaps", show_header=True, header_style="bold")
    for k, v in [
        ("termos_processados", str(n)),
        ("briefings_novos_ok", str(ok_n)),
        ("skipped_cache", str(skip_n)),
        ("falhas", str(fail_n)),
        ("custo_total_brl", f"{cost_total:.4f}"),
        ("word_count_alvo", _hist(word_targets)),
        ("dry_run", str(dry_run)),
        ("prompt_version", str(bundle.version)),
    ]:
        tbl.add_row(k, str(v))
    console.print(tbl)
    if top_alerts:
        console.print("[bold]Alertas (amostra)[/bold]")
        for a in top_alerts:
            console.print(f"  - {a}", markup=False)
    console.print(f"Log JSONL: {log_path}")

    if fail_n:
        raise typer.Exit(code=1)


@app.command("run-pipeline")
def run_pipeline_cmd(
    seed_file: Path = typer.Option(
        ...,
        "--seed-file",
        help="JSON com seeds_termos (ex.: ../seeds/ideia_chat.json).",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Pula confirmação de custo estimado do pipeline.",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Propaga dry-run aos behaviors que suportam (sem persistir onde aplicável).",
    ),
    skip_trends: bool = typer.Option(False, "--skip-trends", help="Pula Google Trends (pytrends)."),
    skip_gaps: bool = typer.Option(
        False,
        "--skip-gaps",
        help="Para após scrape (não chama Claude Sonnet / analyze-gaps).",
    ),
    skip_report: bool = typer.Option(
        False,
        "--skip-report",
        help="Não gera markdown em data/relatorios.",
    ),
    max_seeds: int | None = typer.Option(
        None,
        "--max-seeds",
        min=1,
        help="Limita quantidade de seeds do arquivo (testes).",
    ),
    autocomplete_limit: int = typer.Option(50, "--autocomplete-limit", min=1, max=500),
    autocomplete_force: bool = typer.Option(
        False,
        "--autocomplete-force",
        help="Ignora cache 7 dias na coleta autocomplete.",
    ),
    classify_max_batches: int = typer.Option(40, "--classify-max-batches", min=1, max=200),
    classify_batch_size: int = typer.Option(50, "--classify-batch-size", min=1, max=200),
    min_score: int = typer.Option(7, "--min-score", min=1, max=10),
    prioritize_limit: int = typer.Option(50, "--prioritize-limit", min=1, max=200),
    keep_decrescente: bool = typer.Option(
        False,
        "--keep-decrescente",
        help="Prioriza também termos com tendência decrescente no Trends.",
    ),
    serp_limit: int = typer.Option(50, "--serp-limit", min=1, max=100),
    serp_top_n: int = typer.Option(10, "--serp-top-n", min=1, max=50),
    serp_force: bool = typer.Option(False, "--serp-force", help="Ignora cache SERP."),
    scrape_limit: int = typer.Option(50, "--scrape-limit", min=1, max=100),
    gaps_limit: int = typer.Option(50, "--gaps-limit", min=1, max=100),
    gaps_force: bool = typer.Option(False, "--gaps-force", help="Ignora cache de briefing (60d)."),
    prompt_version: int | None = typer.Option(
        None,
        "--gaps-prompt-version",
        min=1,
        help="Versão do prompt analyze-gaps.md (opcional).",
    ),
) -> None:
    """Fase 0: autocomplete, classify, trends, priorizar, SERP, scrape, gaps e relatório.

    Custo pode ultrapassar R$ 50 (Apify, Firecrawl, Claude).
    Use ``--yes`` em CI ou revise o estimador.
    """
    settings = get_settings()
    skip_confirm = bool(settings.skip_cost_confirm or yes)

    seeds_path = seed_file if seed_file.is_absolute() else (PROJECT_ROOT / seed_file)
    if not seeds_path.is_file():
        console.print(f"[red]Arquivo não encontrado: {seeds_path}[/red]")
        raise typer.Exit(code=2)

    try:
        raw = json.loads(seeds_path.read_text(encoding="utf-8"))
        n_seeds = len([s for s in raw.get("seeds_termos", []) if s and str(s).strip()])
    except (json.JSONDecodeError, OSError) as e:
        console.print(f"[red]Erro ao ler seed: {e}[/red]")
        raise typer.Exit(code=2) from e

    if max_seeds is not None:
        n_seeds = min(n_seeds, max_seeds)

    est = (
        n_seeds * 0.15
        + (classify_max_batches * classify_batch_size * 0.02)
        + serp_limit * 0.12
        + scrape_limit * serp_top_n * 0.02
        + (0 if skip_gaps else gaps_limit * 0.8)
    )
    console.print(
        f"[cyan]run-pipeline[/cyan]: ~{n_seeds} seed(s); custo **muito aproximado** R$ {est:.2f} "
        "(varia com cache e falhas)."
    )
    if (
        not skip_confirm
        and not dry_run
        and not typer.confirm("[yellow]Continuar com o pipeline completo?[/yellow]", default=False)
    ):
        raise typer.Exit(code=0)

    sb = get_supabase()
    summary = run_fase_zero_pipeline(
        seed_file=seed_file,
        sb=sb,
        settings=settings,
        autocomplete_limit=autocomplete_limit,
        max_seeds=max_seeds,
        autocomplete_pause_s=2.0,
        autocomplete_force=autocomplete_force,
        classify_batch_size=classify_batch_size,
        classify_max_batches=classify_max_batches,
        skip_trends=skip_trends,
        trends_limit=80,
        trends_pause_s=5.0,
        min_score=min_score,
        prioritize_limit=prioritize_limit,
        exclude_decrescente=not keep_decrescente,
        serp_top_n=serp_top_n,
        serp_limit=serp_limit,
        serp_pause_s=3.0,
        serp_force=serp_force,
        scrape_top_n=min(10, serp_top_n),
        scrape_limit=scrape_limit,
        scrape_concurrent=3,
        scrape_pause_s=2.0,
        scrape_force=False,
        skip_gaps=skip_gaps,
        gaps_top_n=min(10, serp_top_n),
        gaps_limit=gaps_limit,
        gaps_pause_s=3.0,
        gaps_force=gaps_force,
        prompt_version=prompt_version,
        skip_report=skip_report,
        dry_run=dry_run,
    )

    tbl = Table(title="Resumo run-pipeline (Fase 0)", show_header=True, header_style="bold")
    for k, v in [
        ("seeds_ok", summary.seeds_ok),
        ("seeds_failed", summary.seeds_failed),
        ("classify_batches", summary.classify_batches),
        ("prioritized", summary.prioritized),
        ("serp_ok", summary.serp_ok),
        ("scrape_groups", summary.scrape_groups),
        ("gaps_ok", summary.gaps_ok),
        ("gaps_skipped_cache", summary.gaps_skipped_cache),
        ("gaps_failed", summary.gaps_failed),
        ("custo_total_aprox_brl", summary.total_cost_brl()),
        ("dry_run", dry_run),
    ]:
        tbl.add_row(k, str(v))
    console.print(tbl)
    if summary.report_path:
        console.print(f"Relatório: [cyan]{summary.report_path}[/cyan]")
    log_guess = PROJECT_ROOT / "research" / "data" / "logs"
    console.print(f"Logs: [cyan]{log_guess}[/cyan] (run-pipeline-*.jsonl)")

    if summary.errors:
        console.print(f"[yellow]{len(summary.errors)} avisos/erros (primeiros 8):[/yellow]")
        for e in summary.errors[:8]:
            console.print(f"  - {e}", markup=False)

    if summary.seeds_failed or summary.gaps_failed or summary.scrape_url_failures:
        raise typer.Exit(code=1)


@app.command("report")
def research_report_cmd(
    note: str | None = typer.Option(
        None,
        "--note",
        help="Texto extra na seção Notas do relatório.",
    ),
) -> None:
    """Gera snapshot em markdown: ``research/data/relatorios/fase-0-<timestamp>.md``."""
    sb = get_supabase()
    notes = [note] if note else None
    path = write_fase_zero_report(sb, cost_breakdown=None, pipeline_notes=notes)
    console.print(f"Gerado: [cyan]{path}[/cyan]")


@app.command("fase-0-status")
def fase_zero_status_cmd() -> None:
    """Mostra contagem por status no Supabase e sugere o próximo comando da Fase 0."""
    sb = get_supabase()
    m = fetch_fase_zero_metrics(sb)
    steps = suggest_fase_zero_steps(m)

    t1 = Table(title="Termos por status", show_header=True, header_style="bold")
    t1.add_column("status")
    t1.add_column("n", justify="right")
    for k in sorted(m.by_status.keys()):
        t1.add_row(k, str(m.by_status[k]))
    console.print(t1)

    t2 = Table(title="Resumo", show_header=True, header_style="bold")
    for label, val in [
        ("total_termos", str(m.total_termos)),
        ("coletado sem intencao", str(m.pending_classify)),
        ("briefings_seo (linhas)", str(m.briefings_seo_total)),
        ("briefing_pronto", str(m.briefing_pronto)),
    ]:
        t2.add_row(label, val)
    console.print(t2)

    console.print("[bold]Sugestões (ordem típica)[/bold]")
    for i, s in enumerate(steps, 1):
        console.print(f"  {i}. [cyan]{s.title}[/cyan] — {s.note}")
        console.print(f"     {s.command}")


if __name__ == "__main__":
    app()
