"""Lógica de coleta: Apify → normalização → dedup → Supabase."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from ideiapages_research.clients.apify import ApifyAutocompleteClient, ApifyPAAClient
from ideiapages_research.clients.supabase import get_supabase
from ideiapages_research.settings import PROJECT_ROOT, get_settings
from ideiapages_research.text import normalize_keyword

BEHAVIOR = "research/collect-autocomplete"


class CollectionReport(BaseModel):
    """Resumo de uma execução de coleta para um seed."""

    seed: str
    seed_normalized: str
    skipped_due_to_cache: bool = False
    total_raw_autocomplete: int = 0
    total_raw_paa: int = 0
    unique_after_norm: int = 0
    inserted: int = 0
    already_existed: int = 0
    discarded: int = 0
    estimated_cost_brl: float = 0.0
    dry_run: bool = False
    error: str | None = None


_STOPWORDS: frozenset[str] | None = None


def _stopwords_path() -> Path:
    return PROJECT_ROOT / "references" / "stopwords-pt-br.txt"


def load_stopwords() -> frozenset[str]:
    global _STOPWORDS
    if _STOPWORDS is not None:
        return _STOPWORDS
    path = _stopwords_path()
    out: set[str] = set()
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            w = line.strip().lower()
            if not w or w.startswith("#"):
                continue
            out.add(w)
    _STOPWORDS = frozenset(out)
    return _STOPWORDS


def _is_valid_keyword(s: str) -> bool:
    if len(s) < 2:
        return False
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9 \-]*", s))


def _should_discard(
    keyword_norm: str,
    *,
    seed_norm: str,
    stopwords: frozenset[str],
) -> bool:
    if not _is_valid_keyword(keyword_norm):
        return True
    if keyword_norm == seed_norm:
        return True
    if keyword_norm in stopwords:
        return True
    tokens = keyword_norm.split()
    return bool(tokens) and all(t in stopwords for t in tokens)


def _save_raw_payload(seed_slug: str, payload: dict[str, Any]) -> Path:
    raw_dir = PROJECT_ROOT / "research" / "data" / "raw" / "autocomplete"
    raw_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    path = raw_dir / f"{seed_slug}-{ts}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _slug(s: str) -> str:
    base = normalize_keyword(s)
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return (base[:80] or "seed").strip("-")


def has_recent_collect_for_seed(seed: str) -> bool:
    """True se existir execução recente (janela configurável) com o mesmo seed normalizado."""
    settings = get_settings()
    days = settings.collect_autocomplete_cache_days
    seed_norm = normalize_keyword(seed)
    if len(seed_norm) < 2:
        return False
    cutoff = datetime.now(UTC) - timedelta(days=days)
    sb = get_supabase()
    r = (
        sb.table("metricas_coleta")
        .select("log_jsonb, comecou_em")
        .eq("behavior", BEHAVIOR)
        .gte("comecou_em", cutoff.isoformat())
        .order("comecou_em", desc=True)
        .limit(200)
        .execute()
    )
    for row in r.data or []:
        lj = row.get("log_jsonb") or {}
        if lj.get("seed_normalized") == seed_norm:
            return True
    return False


def _try_insert_term(keyword: str, fonte: str) -> str:
    """Retorna 'inserted' | 'exists'."""
    sb = get_supabase()
    existing = sb.table("termos").select("id").eq("keyword", keyword).limit(1).execute()
    if existing.data:
        return "exists"
    sb.table("termos").insert({"keyword": keyword, "fonte": fonte, "status": "coletado"}).execute()
    return "inserted"


def collect_for_seed(
    seed: str,
    *,
    limit: int = 50,
    geo: str = "BR",
    lang: str = "pt-BR",
    dry_run: bool = False,
    force: bool = False,
    autocomplete_client: ApifyAutocompleteClient | None = None,
    paa_client: ApifyPAAClient | None = None,
) -> CollectionReport:
    """Coleta autocomplete + PAA, normaliza, deduplica e persiste em ``termos``."""
    seed_norm = normalize_keyword(seed)
    if len(seed_norm) < 2 or len(seed.strip()) > 200:
        return CollectionReport(
            seed=seed,
            seed_normalized=seed_norm,
            error="seed inválido (comprimento 2–200 após normalização mínima)",
        )

    if not force and not dry_run and has_recent_collect_for_seed(seed):
        return CollectionReport(
            seed=seed,
            seed_normalized=seed_norm,
            skipped_due_to_cache=True,
            dry_run=dry_run,
        )

    ac = autocomplete_client or ApifyAutocompleteClient()
    paa = paa_client or ApifyPAAClient()
    stopwords = load_stopwords()

    suggestions = ac.collect(seed.strip(), geo=geo, lang=lang, limit=limit)
    questions = paa.collect(seed.strip(), geo=geo, lang=lang, limit=limit)
    cost = float(ac.last_call_cost_brl + paa.last_call_cost_brl)

    raw_payload: dict[str, Any] = {
        "seed": seed.strip(),
        "geo": geo,
        "lang": lang,
        "limit": limit,
        "autocomplete": [s.model_dump() for s in suggestions],
        "paa": [q.model_dump() for q in questions],
        "cost_brl_estimate": cost,
        "collected_at": datetime.now(UTC).isoformat(),
    }
    _save_raw_payload(_slug(seed), raw_payload)

    # Dedup cross-fonte mantendo primeira ocorrência (autocomplete antes de PAA).
    ordered: list[tuple[str, str]] = []
    seen: set[str] = set()
    for s in suggestions:
        kn = normalize_keyword(s.text)
        if kn in seen:
            continue
        seen.add(kn)
        ordered.append((kn, "autocomplete"))
    for q in questions:
        kn = normalize_keyword(q.question)
        if kn in seen:
            continue
        seen.add(kn)
        ordered.append((kn, "paa"))

    discarded = 0
    to_persist: list[tuple[str, str]] = []
    for kn, fonte in ordered:
        if _should_discard(kn, seed_norm=seed_norm, stopwords=stopwords):
            discarded += 1
            continue
        to_persist.append((kn, fonte))

    inserted = 0
    already = 0
    if not dry_run:
        for kn, fonte in to_persist:
            status = _try_insert_term(kn, fonte)
            if status == "inserted":
                inserted += 1
            else:
                already += 1

        sb = get_supabase()
        started = datetime.now(UTC)
        log = {
            "seed": seed.strip(),
            "seed_normalized": seed_norm,
            "geo": geo,
            "lang": lang,
            "limit": limit,
            "dry_run": dry_run,
            "force": force,
            "totals": {
                "raw_autocomplete": len(suggestions),
                "raw_paa": len(questions),
                "unique_after_filter": len(to_persist),
                "inserted": inserted,
                "already_existed": already,
                "discarded": discarded,
            },
        }
        sb.table("metricas_coleta").insert(
            {
                "behavior": BEHAVIOR,
                "comecou_em": started.isoformat(),
                "terminou_em": datetime.now(UTC).isoformat(),
                "items_processados": len(to_persist),
                "items_sucesso": inserted,
                "items_falha": 0,
                "custo_brl": cost,
                "log_jsonb": log,
            }
        ).execute()

    return CollectionReport(
        seed=seed.strip(),
        seed_normalized=seed_norm,
        total_raw_autocomplete=len(suggestions),
        total_raw_paa=len(questions),
        unique_after_norm=len(to_persist),
        inserted=inserted,
        already_existed=already if not dry_run else 0,
        discarded=discarded,
        estimated_cost_brl=cost,
        dry_run=dry_run,
    )
