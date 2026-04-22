"""Orquestracao: SERP -> Firecrawl -> extractor -> ``conteudo_concorrente``."""

from __future__ import annotations

import asyncio
import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

from supabase import Client

from ideiapages_research.behaviors.scrape_competitors.extractor import extract_structure
from ideiapages_research.clients.firecrawl import scrape_url
from ideiapages_research.clients.supabase import get_supabase
from ideiapages_research.settings import PROJECT_ROOT, Settings, get_settings
from ideiapages_research.types.competitor import ExtractedStructure, ScrapeBatchReport

BEHAVIOR = "research/scrape-competitors"
RAW_SCRAPE_DIR = PROJECT_ROOT / "research" / "data" / "raw" / "scrape"


@dataclass
class _RowOutcome:
    cache_hit: bool = False
    ok: bool = False
    fail: bool = False
    thin: int = 0
    paywalled: int = 0
    truncated: int = 0
    cost: float = 0.0
    error: str | None = None


def _url_hash16(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def _write_raw_markdown(url: str, markdown: str) -> None:
    RAW_SCRAPE_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_SCRAPE_DIR / f"{_url_hash16(url)}.md").write_text(markdown, encoding="utf-8")


def load_serp_group_by_anchor(sb: Client, anchor_snapshot_id: UUID) -> list[dict[str, Any]]:
    r = sb.table("serp_snapshots").select("*").eq("id", str(anchor_snapshot_id)).limit(1).execute()
    if not r.data:
        return []
    row = cast(dict[str, Any], r.data[0])
    tid, cap = row["termo_id"], row["capturado_em"]
    g = (
        sb.table("serp_snapshots")
        .select("*")
        .eq("termo_id", tid)
        .eq("capturado_em", cap)
        .order("posicao")
        .execute()
    )
    return [cast(dict[str, Any], x) for x in (g.data or [])]


def load_serp_group_latest_termo(sb: Client, termo_id: UUID) -> list[dict[str, Any]]:
    g = (
        sb.table("serp_snapshots")
        .select("*")
        .eq("termo_id", str(termo_id))
        .order("capturado_em", desc=True)
        .limit(80)
        .execute()
    )
    rows = [cast(dict[str, Any], x) for x in (g.data or [])]
    if not rows:
        return []
    cap = rows[0]["capturado_em"]
    return sorted(
        [x for x in rows if x["capturado_em"] == cap],
        key=lambda x: int(x.get("posicao") or 0),
    )


def _is_fresh_cache(
    sb: Client,
    *,
    snapshot_row_id: str,
    url: str,
    days: int,
    force: bool,
) -> bool:
    if force:
        return False
    r = (
        sb.table("conteudo_concorrente")
        .select("raspado_em")
        .eq("snapshot_id", snapshot_row_id)
        .eq("url", url)
        .limit(1)
        .execute()
    )
    if not r.data:
        return False
    raw = cast(dict[str, Any], r.data[0]).get("raspado_em")
    if not raw or not isinstance(raw, str):
        return False
    ts = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    return datetime.now(UTC) - ts.astimezone(UTC) < timedelta(days=days)


def _merge_lang(ex: ExtractedStructure, page_lang: str | None) -> ExtractedStructure:
    if page_lang:
        return ex.model_copy(update={"idioma_detectado": page_lang})
    return ex


def _process_one_row(
    row: dict[str, Any],
    sb: Client,
    settings: Settings,
    *,
    force: bool,
    dry_run: bool,
) -> _RowOutcome:
    sid = str(row["id"])
    url = str(row["url"])
    if _is_fresh_cache(
        sb,
        snapshot_row_id=sid,
        url=url,
        days=settings.scrape_cache_days,
        force=force,
    ):
        return _RowOutcome(cache_hit=True)

    try:
        page = scrape_url(
            url,
            timeout_ms=settings.firecrawl_timeout_ms,
            max_chars=settings.scrape_max_markdown_chars,
        )
    except Exception as e:
        return _RowOutcome(fail=True, error=str(e)[:500])

    ext = extract_structure(page.markdown, url)
    ext = _merge_lang(ext, page.detected_language)
    if not dry_run:
        _write_raw_markdown(url, page.markdown)

    o = _RowOutcome(ok=True, cost=page.estimated_cost_brl)
    if ext.thin:
        o.thin = 1
    if page.paywalled:
        o.paywalled = 1
    if page.truncated:
        o.truncated = 1

    if dry_run:
        return o

    payload: dict[str, Any] = {
        "snapshot_id": sid,
        "url": url,
        "markdown": page.markdown,
        "word_count": ext.word_count,
        "headings_h2": ext.headings_h2,
        "headings_h3": ext.headings_h3,
        "tem_faq": ext.tem_faq,
        "tem_tabela": ext.tem_tabela,
        "tem_imagem": ext.tem_imagem,
        "idioma_detectado": ext.idioma_detectado,
        "thin": ext.thin,
        "truncated": page.truncated,
        "paywalled": page.paywalled,
    }
    sb.table("conteudo_concorrente").upsert(
        payload,
        on_conflict="snapshot_id,url",
    ).execute()
    return o


async def scrape_competitors_for_serp_rows(
    serp_rows: list[dict[str, Any]],
    *,
    top_n: int = 10,
    max_concurrent: int = 3,
    dry_run: bool = False,
    force: bool = False,
    sb: Client | None = None,
    settings: Settings | None = None,
) -> ScrapeBatchReport:
    settings = settings or get_settings()
    sb = sb or get_supabase()
    if not serp_rows:
        raise ValueError("serp_rows vazio")

    sorted_rows = sorted(serp_rows, key=lambda r: int(r.get("posicao") or 0))[:top_n]
    termo_id = UUID(str(sorted_rows[0]["termo_id"]))
    cap = str(sorted_rows[0]["capturado_em"])

    sem = asyncio.Semaphore(max(1, max_concurrent))

    async def _run(row: dict[str, Any]) -> _RowOutcome | BaseException:
        async with sem:
            try:
                return await asyncio.to_thread(
                    _process_one_row,
                    row,
                    sb,
                    settings,
                    force=force,
                    dry_run=dry_run,
                )
            except BaseException as e:
                return e

    outcomes = await asyncio.gather(*[_run(r) for r in sorted_rows])
    scraped_ok = 0
    scraped_fail = 0
    cache_hits = 0
    thin = 0
    paywalled = 0
    truncated = 0
    cost = 0.0
    errors: list[str] = []

    for o in outcomes:
        if isinstance(o, BaseException):
            scraped_fail += 1
            errors.append(str(o)[:300])
            continue
        if o.cache_hit:
            cache_hits += 1
            continue
        if o.fail:
            scraped_fail += 1
            if o.error:
                errors.append(o.error)
            continue
        if o.ok:
            scraped_ok += 1
            cost += o.cost
            thin += o.thin
            paywalled += o.paywalled
            truncated += o.truncated

    if not dry_run:
        sb.table("termos").update({"status": "scraped"}).eq("id", str(termo_id)).execute()
        started = datetime.now(UTC)
        sb.table("metricas_coleta").insert(
            {
                "behavior": BEHAVIOR,
                "comecou_em": started.isoformat(),
                "terminou_em": datetime.now(UTC).isoformat(),
                "items_processados": len(sorted_rows),
                "items_sucesso": scraped_ok,
                "items_falha": scraped_fail,
                "custo_brl": round(cost, 4),
                "log_jsonb": {
                    "termo_id": str(termo_id),
                    "capturado_em": cap,
                    "cache_hits": cache_hits,
                    "thin": thin,
                    "paywalled": paywalled,
                    "truncated": truncated,
                },
            }
        ).execute()

    return ScrapeBatchReport(
        termo_id=termo_id,
        capturado_em=cap,
        urls_total=len(sorted_rows),
        scraped_ok=scraped_ok,
        scraped_fail=scraped_fail,
        cache_hits=cache_hits,
        thin=thin,
        paywalled=paywalled,
        truncated=truncated,
        cost_brl=round(cost, 4),
        errors=errors[:20],
    )
