"""Persistencia de snapshots SERP em ``serp_snapshots`` + metricas."""

from __future__ import annotations

import json
import re
from collections import Counter
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, cast
from urllib.parse import urlparse
from uuid import UUID

from supabase import Client

from ideiapages_research.clients.apify import ApifySerpClient
from ideiapages_research.clients.supabase import get_supabase
from ideiapages_research.settings import PROJECT_ROOT, Settings, get_settings
from ideiapages_research.text import normalize_keyword
from ideiapages_research.types.serp import SerpCollectResult, SerpOrganicItem, SerpSnapshotReport

BEHAVIOR = "research/collect-serp"
EXCLUSION_FILE = PROJECT_ROOT / "references" / "serp_exclusion_domains.txt"
RAW_DIR = PROJECT_ROOT / "research" / "data" / "raw" / "serp"


def load_serp_exclusion_domains(settings: Settings | None = None) -> set[str]:
    """Hosts excluidos (lowercase, sem www.) + env ``serp_exclude_domains_extra``."""
    settings = settings or get_settings()
    out: set[str] = set()
    if EXCLUSION_FILE.is_file():
        for line in EXCLUSION_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            h = line.lower()
            if h.startswith("www."):
                h = h[4:]
            out.add(h)
    extra = (settings.serp_exclude_domains_extra or "").strip()
    if extra:
        for part in extra.split(","):
            h = part.strip().lower()
            if h.startswith("www."):
                h = h[4:]
            if h:
                out.add(h)
    return out


def _host_key(url: str) -> str:
    try:
        netloc = (urlparse(url).netloc or "").lower()
    except Exception:
        return ""
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc


def _is_skipped_url(url: str) -> bool:
    u = url.lower()
    if not u.startswith(("http://", "https://")):
        return True
    if "google.com/search?" in u or u.startswith("https://www.google.com/search"):
        return True
    return bool("/search?q=" in u and "google." in u)


def _filter_organic(
    organic: list[SerpOrganicItem],
    excluded_hosts: set[str],
    top_n: int,
) -> list[SerpOrganicItem]:
    kept: list[SerpOrganicItem] = []
    for item in organic:
        if len(kept) >= top_n:
            break
        if _is_skipped_url(item.url):
            continue
        host = _host_key(item.url)
        if not host:
            continue
        if any(host == ex or host.endswith("." + ex) for ex in excluded_hosts):
            continue
        kept.append(
            SerpOrganicItem(
                position=len(kept) + 1,
                url=item.url,
                title=item.title,
                meta_description=item.meta_description,
            )
        )
    return kept


def _latest_snapshot_time(sb: Client, termo_id: UUID) -> datetime | None:
    r = (
        sb.table("serp_snapshots")
        .select("capturado_em")
        .eq("termo_id", str(termo_id))
        .order("capturado_em", desc=True)
        .limit(1)
        .execute()
    )
    if not r.data:
        return None
    row0 = cast(dict[str, Any], r.data[0])
    raw = row0.get("capturado_em")
    if not raw or not isinstance(raw, str):
        return None
    s = raw.replace("Z", "+00:00")
    return datetime.fromisoformat(s)


def _slug(s: str) -> str:
    x = normalize_keyword(s)
    x = re.sub(r"[^a-z0-9]+", "-", x).strip("-")
    return x[:80] or "term"


def _write_raw_json(keyword: str, payload: list[dict[str, Any]]) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    path = RAW_DIR / f"{_slug(keyword)}-{ts}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def log_metricas_serp(log: dict[str, Any], *, items_ok: int, items_fail: int, cost: float) -> None:
    started = datetime.now(UTC)
    sb = get_supabase()
    sb.table("metricas_coleta").insert(
        {
            "behavior": BEHAVIOR,
            "comecou_em": started.isoformat(),
            "terminou_em": datetime.now(UTC).isoformat(),
            "items_processados": items_ok + items_fail,
            "items_sucesso": items_ok,
            "items_falha": items_fail,
            "custo_brl": round(cost, 4),
            "log_jsonb": log,
        }
    ).execute()


def snapshot_serp_for_term(
    *,
    termo_id: UUID,
    keyword: str,
    status: str,
    top_n: int = 10,
    geo: str = "BR",
    lang: str = "pt-BR",
    dry_run: bool = False,
    force: bool = False,
    sb: Client | None = None,
    client: ApifySerpClient | None = None,
    settings: Settings | None = None,
) -> SerpSnapshotReport:
    settings = settings or get_settings()
    sb = sb or get_supabase()
    if status == "descartado":
        return SerpSnapshotReport(
            termo_id=termo_id,
            keyword=keyword,
            rows_inserted=0,
            skipped_cache=False,
            estimated_cost_brl=0.0,
            warnings=["termo descartado: ignorado"],
            raw_path=None,
        )

    allowed = {"coletado", "analisado", "priorizado", "snapshot_serp_ok"}
    if status not in allowed:
        return SerpSnapshotReport(
            termo_id=termo_id,
            keyword=keyword,
            rows_inserted=0,
            skipped_cache=False,
            estimated_cost_brl=0.0,
            warnings=[f"status inesperado: {status!r}"],
            raw_path=None,
        )

    if not force:
        latest = _latest_snapshot_time(sb, termo_id)
        if latest is not None:
            age = datetime.now(UTC) - latest.astimezone(UTC)
            if age < timedelta(days=settings.serp_cache_days):
                return SerpSnapshotReport(
                    termo_id=termo_id,
                    keyword=keyword,
                    rows_inserted=0,
                    skipped_cache=True,
                    estimated_cost_brl=0.0,
                    warnings=[],
                    raw_path=None,
                )

    apify = client or ApifySerpClient()
    collected: SerpCollectResult = apify.collect(keyword, geo=geo, lang=lang, top_n=top_n)
    excluded = load_serp_exclusion_domains(settings)
    filtered = _filter_organic(collected.organic, excluded, top_n)

    raw_path: Path | None = None
    if not dry_run:
        raw_path = _write_raw_json(keyword, collected.raw_dataset_items)

    warnings: list[str] = []
    if len(filtered) < max(1, min(8, top_n) - 1):
        warnings.append(
            f"poucos organicos apos filtro ({len(filtered)}); verifique query ou bloqueios."
        )

    top_domains = [h for h, _ in Counter(_host_key(o.url) for o in filtered).most_common(5)]

    if dry_run:
        return SerpSnapshotReport(
            termo_id=termo_id,
            keyword=keyword,
            rows_inserted=len(filtered),
            skipped_cache=False,
            estimated_cost_brl=collected.estimated_cost_brl,
            top_domains=top_domains,
            warnings=warnings,
            raw_path=None,
        )

    capturado = datetime.now(UTC).isoformat()
    rows: list[dict[str, Any]] = []
    for o in filtered:
        rows.append(
            {
                "termo_id": str(termo_id),
                "posicao": o.position,
                "url": o.url,
                "titulo": o.title,
                "meta_description": o.meta_description,
                "capturado_em": capturado,
                "raw_jsonb": {
                    "title": o.title,
                    "url": o.url,
                    "description": o.meta_description,
                    "extras_head": collected.extras.model_dump(),
                },
            }
        )

    if rows:
        sb.table("serp_snapshots").insert(rows).execute()
        sb.table("termos").update({"status": "snapshot_serp_ok"}).eq("id", str(termo_id)).execute()
    else:
        warnings.append("nenhuma linha inserida; status do termo nao alterado.")

    return SerpSnapshotReport(
        termo_id=termo_id,
        keyword=keyword,
        rows_inserted=len(rows),
        skipped_cache=False,
        estimated_cost_brl=collected.estimated_cost_brl,
        top_domains=top_domains,
        warnings=warnings,
        raw_path=str(raw_path) if raw_path else None,
    )
