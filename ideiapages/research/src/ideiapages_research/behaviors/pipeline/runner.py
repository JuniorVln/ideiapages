"""Orquestra a Fase 0: coleta, classificação, trends, priorização, SERP, scrape e gaps."""

from __future__ import annotations

import asyncio
import json
import math
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, cast
from uuid import UUID

from pydantic import BaseModel, Field, ValidationError
from supabase import Client

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
from ideiapages_research.behaviors.collect_autocomplete.collector import collect_for_seed
from ideiapages_research.behaviors.collect_serp.collector import snapshot_serp_for_term
from ideiapages_research.behaviors.collect_trends.analyzer import analyze_and_persist
from ideiapages_research.behaviors.collect_trends.runner import iter_analisado_trend_candidates
from ideiapages_research.behaviors.pipeline.report import write_fase_zero_report
from ideiapages_research.behaviors.scrape_competitors.scraper import (
    load_serp_group_latest_termo,
    scrape_competitors_for_serp_rows,
)
from ideiapages_research.clients.pytrends_client import PyTrendsBannedError, PyTrendsClient
from ideiapages_research.settings import PROJECT_ROOT, Settings, get_settings
from ideiapages_research.text import normalize_keyword


class _SeedFile(BaseModel):
    seeds_termos: list[str] = Field(..., min_length=1)


@dataclass
class PipelineRunSummary:
    """Métricas e custos aproximados de uma execução."""

    started_at: str
    finished_at: str = ""
    seeds_ok: int = 0
    seeds_failed: int = 0
    autocomplete_cost_brl: float = 0.0
    classify_cost_brl: float = 0.0
    classify_batches: int = 0
    trends_ok: int = 0
    trends_failed: int = 0
    prioritized: int = 0
    serp_ok: int = 0
    serp_cost_brl: float = 0.0
    scrape_groups: int = 0
    scrape_cost_brl: float = 0.0
    scrape_url_failures: int = 0
    gaps_ok: int = 0
    gaps_skipped_cache: int = 0
    gaps_failed: int = 0
    gaps_cost_brl: float = 0.0
    errors: list[str] = field(default_factory=list)
    report_path: str | None = None

    def cost_breakdown(self) -> dict[str, float]:
        return {
            "collect_autocomplete": round(self.autocomplete_cost_brl, 4),
            "classify_terms": round(self.classify_cost_brl, 4),
            "collect_serp": round(self.serp_cost_brl, 4),
            "scrape_competitors": round(self.scrape_cost_brl, 4),
            "analyze_gaps": round(self.gaps_cost_brl, 4),
        }

    def total_cost_brl(self) -> float:
        return round(sum(self.cost_breakdown().values()), 4)


def _potencial_busca_score_volume(row: dict[str, Any]) -> float:
    """Alinha com o front: score × (1 + ln(1+volume)); volume ausente = 0."""
    s = row.get("score_conversao")
    try:
        sf = float(s) if s is not None else 0.0
    except (TypeError, ValueError):
        sf = 0.0
    v = row.get("volume_estimado")
    try:
        vf = float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        vf = 0.0
    vf = max(0.0, vf)
    return sf * (1.0 + math.log1p(vf))


def auto_prioritize_terms(
    sb: Client,
    *,
    min_score: int = 7,
    limit: int = 50,
    exclude_decrescente: bool = True,
    dry_run: bool = False,
) -> int:
    """Marca ``analisado`` → ``priorizado`` por score×volume (índice) e tendência."""
    r = (
        sb.table("termos")
        .select("id,score_conversao,tendencia_pytrends,volume_estimado")
        .eq("status", "analisado")
        .gte("score_conversao", min_score)
        .order("score_conversao", desc=True)
        .limit(800)
        .execute()
    )
    rows = [cast(dict[str, Any], x) for x in (r.data or [])]
    filtered: list[dict[str, Any]] = []
    for row in rows:
        if exclude_decrescente:
            tp = row.get("tendencia_pytrends")
            if isinstance(tp, dict) and tp.get("tendencia") == "decrescente":
                continue
        filtered.append(row)
    filtered.sort(key=_potencial_busca_score_volume, reverse=True)
    picked = filtered[:limit]

    if dry_run:
        return len(picked)

    for row in picked:
        sb.table("termos").update({"status": "priorizado"}).eq("id", str(row["id"])).execute()
    return len(picked)


def _append_jsonl(path: Path, obj: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def run_fase_zero_pipeline(
    *,
    seed_file: Path,
    sb: Client,
    settings: Settings | None = None,
    # autocomplete
    autocomplete_limit: int = 50,
    max_seeds: int | None = None,
    autocomplete_pause_s: float = 2.0,
    autocomplete_force: bool = False,
    # classify
    classify_batch_size: int = 50,
    classify_max_batches: int = 40,
    # trends
    skip_trends: bool = False,
    trends_limit: int = 80,
    trends_pause_s: float = 5.0,
    # prioritize
    min_score: int = 7,
    prioritize_limit: int = 50,
    exclude_decrescente: bool = True,
    # serp
    serp_top_n: int = 10,
    serp_limit: int = 50,
    serp_pause_s: float = 3.0,
    serp_force: bool = False,
    # scrape
    scrape_top_n: int = 10,
    scrape_limit: int = 50,
    scrape_concurrent: int = 3,
    scrape_pause_s: float = 2.0,
    scrape_force: bool = False,
    # gaps
    skip_gaps: bool = False,
    gaps_top_n: int = 10,
    gaps_limit: int = 50,
    gaps_pause_s: float = 3.0,
    gaps_force: bool = False,
    prompt_version: int | None = None,
    # report
    skip_report: bool = False,
    # global
    dry_run: bool = False,
    log_path: Path | None = None,
) -> PipelineRunSummary:
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    log = log_path or (PROJECT_ROOT / "research" / "data" / "logs" / f"run-pipeline-{ts}.jsonl")

    summary = PipelineRunSummary(started_at=datetime.now(UTC).isoformat())

    def log_ev(ev: dict[str, Any]) -> None:
        _append_jsonl(log, ev)

    path = seed_file if seed_file.is_absolute() else (PROJECT_ROOT / seed_file)
    if not path.is_file():
        summary.errors.append(f"seed_file não encontrado: {path}")
        summary.finished_at = datetime.now(UTC).isoformat()
        return summary

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        parsed_seed = _SeedFile.model_validate(raw)
    except (json.JSONDecodeError, ValidationError) as e:
        summary.errors.append(f"seed_file inválido: {e}")
        summary.finished_at = datetime.now(UTC).isoformat()
        return summary

    seeds = [s.strip() for s in parsed_seed.seeds_termos if s.strip()]
    if max_seeds is not None:
        seeds = seeds[: max(0, max_seeds)]
    if not seeds:
        summary.errors.append("seeds_termos vazio após normalização")
        summary.finished_at = datetime.now(UTC).isoformat()
        return summary

    settings = settings or get_settings()

    # --- 1) Autocomplete ---
    for i, s in enumerate(seeds):
        try:
            rep = collect_for_seed(
                s,
                limit=autocomplete_limit,
                geo="BR",
                lang="pt-BR",
                dry_run=dry_run,
                force=autocomplete_force,
            )
        except Exception as e:
            summary.seeds_failed += 1
            summary.errors.append(f"autocomplete {s!r}: {e}")
            log_ev({"step": "collect_autocomplete", "seed": s, "error": str(e)})
        else:
            if rep.error:
                summary.seeds_failed += 1
                summary.errors.append(f"autocomplete {s!r}: {rep.error}")
            elif rep.skipped_due_to_cache:
                log_ev({"step": "collect_autocomplete", "seed": s, "skipped": "cache"})
            else:
                summary.seeds_ok += 1
                summary.autocomplete_cost_brl += float(rep.estimated_cost_brl)
                log_ev({"step": "collect_autocomplete", "seed": s, "ok": True})
        if i < len(seeds) - 1 and autocomplete_pause_s > 0:
            time.sleep(autocomplete_pause_s)

    # --- 2) Classify ---
    try:
        facts = load_product_facts()
        bundle = load_prompt_bundle(prompt_version=None)
    except Exception as e:
        summary.errors.append(f"classify setup: {e}")
        summary.finished_at = datetime.now(UTC).isoformat()
        return summary

    batches = 0
    while batches < classify_max_batches:
        rows = fetch_terms_for_classify(
            sb, reclassify=False, limit=classify_batch_size
        )
        if not rows:
            break
        res = classify_batch(
            rows,
            product_facts=facts,
            bundle=bundle,
            dry_run=dry_run,
            sb=sb,
            settings=settings,
            batch_index=batches,
        )
        summary.classify_cost_brl += res.cost_brl
        summary.classify_batches += 1
        batches += 1
        log_ev(
            {
                "step": "classify_terms",
                "batch": batches,
                "processed": res.processed,
                "succeeded": res.succeeded,
                "failed": res.failed,
                "cost_brl": res.cost_brl,
            }
        )
        if res.failed == len(rows) and res.processed > 0:
            summary.errors.append(f"classify batch {batches}: todas falharam")
            break

    # --- 3) Trends ---
    if not skip_trends:
        client = PyTrendsClient()
        candidates = iter_analisado_trend_candidates(
            limit=trends_limit,
            force=False,
            cache_days=settings.trend_cache_days,
        )
        for i, row in enumerate(candidates):
            tid = str(row["id"])
            kw = normalize_keyword(str(row["keyword"]))
            try:
                result = client.fetch(kw, geo="BR", timeframe="today 12-m")
                analyze_and_persist(UUID(tid), kw, result, dry_run=dry_run)
                summary.trends_ok += 1
                log_ev({"step": "collect_trends", "keyword": kw, "ok": True})
            except PyTrendsBannedError as e:
                summary.trends_failed += 1
                summary.errors.append(f"trends ban: {e}")
                log_ev({"step": "collect_trends", "error": "banned"})
                break
            except Exception as e:
                summary.trends_failed += 1
                summary.errors.append(f"trends {kw!r}: {e}")
                log_ev({"step": "collect_trends", "keyword": kw, "error": str(e)})
            if i < len(candidates) - 1 and trends_pause_s > 0:
                time.sleep(trends_pause_s)

    # --- 4) Priorizar ---
    summary.prioritized = auto_prioritize_terms(
        sb,
        min_score=min_score,
        limit=prioritize_limit,
        exclude_decrescente=exclude_decrescente,
        dry_run=dry_run,
    )
    log_ev({"step": "prioritize", "count": summary.prioritized})

    # --- 5) SERP ---
    pq = (
        sb.table("termos")
        .select("id,keyword,status")
        .eq("status", "priorizado")
        .order("updated_at", desc=False)
        .limit(serp_limit)
        .execute()
    )
    serp_rows = [cast(dict[str, Any], x) for x in (pq.data or [])]
    for i, row in enumerate(serp_rows):
        tid = UUID(str(row["id"]))
        kw = str(row["keyword"])
        st = str(row["status"])
        try:
            rep = snapshot_serp_for_term(
                termo_id=tid,
                keyword=kw,
                status=st,
                top_n=serp_top_n,
                dry_run=dry_run,
                force=serp_force,
                sb=sb,
                settings=settings,
            )
            summary.serp_ok += 1
            if not rep.skipped_cache:
                summary.serp_cost_brl += rep.estimated_cost_brl
            log_ev(
                {
                    "step": "collect_serp",
                    "keyword": kw,
                    "inserted": rep.rows_inserted,
                    "cost_brl": rep.estimated_cost_brl,
                }
            )
        except Exception as e:
            summary.errors.append(f"serp {kw!r}: {e}")
            log_ev({"step": "collect_serp", "keyword": kw, "error": str(e)})
        if i < len(serp_rows) - 1 and serp_pause_s > 0:
            time.sleep(serp_pause_s)

    # --- 6) Scrape ---
    sq = (
        sb.table("termos")
        .select("id,keyword")
        .eq("status", "snapshot_serp_ok")
        .order("updated_at", desc=False)
        .limit(scrape_limit)
        .execute()
    )
    scrape_terms = [cast(dict[str, Any], x) for x in (sq.data or [])]
    for i, row in enumerate(scrape_terms):
        tid = UUID(str(row["id"]))
        g = load_serp_group_latest_termo(sb, tid)
        if not g:
            summary.errors.append(f"scrape: sem SERP para {tid}")
            continue
        try:
            rep = asyncio.run(
                scrape_competitors_for_serp_rows(
                    g,
                    top_n=scrape_top_n,
                    max_concurrent=scrape_concurrent,
                    dry_run=dry_run,
                    force=scrape_force,
                    sb=sb,
                    settings=settings,
                )
            )
            summary.scrape_groups += 1
            summary.scrape_cost_brl += rep.cost_brl
            summary.scrape_url_failures += rep.scraped_fail
            log_ev(
                {
                    "step": "scrape_competitors",
                    "termo_id": str(tid),
                    "cost_brl": rep.cost_brl,
                    "fail": rep.scraped_fail,
                }
            )
        except Exception as e:
            summary.errors.append(f"scrape {tid}: {e}")
            log_ev({"step": "scrape_competitors", "termo_id": str(tid), "error": str(e)})
        if i < len(scrape_terms) - 1 and scrape_pause_s > 0:
            time.sleep(scrape_pause_s)

    # --- 7) Analyze gaps ---
    if not skip_gaps:
        gap_rows = fetch_term_rows_scraped(sb, limit=gaps_limit)
        for i, row in enumerate(gap_rows):
            tid = UUID(str(row["id"]))
            try:
                rep = analyze_gaps_for_term(
                    sb,
                    tid,
                    keyword=str(row["keyword"]),
                    intencao=row.get("intencao"),
                    score_conversao=row.get("score_conversao"),
                    cluster=row.get("cluster"),
                    tipo_pagina=row.get("tipo_pagina_recomendado"),
                    prompt_version=prompt_version,
                    top_n=gaps_top_n,
                    dry_run=dry_run,
                    force=gaps_force,
                    settings=settings,
                )
                if rep.skipped_cache:
                    summary.gaps_skipped_cache += 1
                elif rep.ok:
                    summary.gaps_ok += 1
                    summary.gaps_cost_brl += rep.cost_brl
                else:
                    summary.gaps_failed += 1
                    if rep.error:
                        summary.errors.append(f"gaps {row.get('keyword')!r}: {rep.error}")
                log_ev(
                    {
                        "step": "analyze_gaps",
                        "keyword": row.get("keyword"),
                        "ok": rep.ok,
                        "skipped_cache": rep.skipped_cache,
                        "cost_brl": rep.cost_brl,
                    }
                )
            except Exception as e:
                summary.gaps_failed += 1
                summary.errors.append(f"gaps {tid}: {e}")
                log_ev({"step": "analyze_gaps", "error": str(e)})
            if i < len(gap_rows) - 1 and gaps_pause_s > 0:
                time.sleep(gaps_pause_s)

    summary.finished_at = datetime.now(UTC).isoformat()

    if not skip_report:
        notes = [
            f"Log JSONL: {log}",
            f"Priorizados (min_score={min_score}): {summary.prioritized}",
        ]
        if summary.errors:
            notes.append(f"Erros/amostras: {len(summary.errors)} (ver log)")
        rp = write_fase_zero_report(
            sb,
            cost_breakdown=summary.cost_breakdown(),
            pipeline_notes=notes,
        )
        summary.report_path = str(rp)

    log_ev(
        {
            "step": "done",
            "summary": summary.cost_breakdown(),
            "total_brl": summary.total_cost_brl(),
        }
    )
    return summary
