"""Orquestração Supabase + métricas para collect-trends."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from ideiapages_research.clients.supabase import get_supabase
from ideiapages_research.text import normalize_keyword

BEHAVIOR = "research/collect-trends"


def ensure_term_manual_trends(keyword: str) -> UUID:
    """Garante linha em ``termos`` para keyword normalizada (fonte manual_trends)."""
    kw = normalize_keyword(keyword)
    if len(kw) < 2:
        raise ValueError("keyword muito curta após normalização")
    sb = get_supabase()
    r = sb.table("termos").select("id").eq("keyword", kw).limit(1).execute()
    if r.data:
        return UUID(str(r.data[0]["id"]))
    ins = (
        sb.table("termos")
        .insert({"keyword": kw, "fonte": "manual_trends", "status": "coletado"})
        .execute()
    )
    if not ins.data:
        raise RuntimeError("falha ao inserir termo manual_trends")
    return UUID(str(ins.data[0]["id"]))


def iter_analisado_trend_candidates(
    *,
    limit: int,
    force: bool,
    cache_days: int,
) -> list[dict[str, Any]]:
    """Termos ``analisado`` cuja tendência falta ou está com cache expirado."""
    from ideiapages_research.behaviors.collect_trends.analyzer import should_skip_trend_refresh

    sb = get_supabase()
    r = (
        sb.table("termos")
        .select("id, keyword, tendencia_pytrends")
        .eq("status", "analisado")
        .limit(800)
        .execute()
    )
    out: list[dict[str, Any]] = []
    for row in r.data or []:
        if len(out) >= limit:
            break
        tp = row.get("tendencia_pytrends")
        tp_d = tp if isinstance(tp, dict) else None
        if should_skip_trend_refresh(tp_d, force=force, cache_days=cache_days):
            continue
        out.append(row)
    return out


def log_metricas_coleta(log: dict[str, Any], *, items_ok: int, items_fail: int) -> None:
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
            "custo_brl": 0,
            "log_jsonb": log,
        }
    ).execute()
