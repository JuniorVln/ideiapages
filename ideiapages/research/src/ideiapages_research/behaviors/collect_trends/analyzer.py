"""Análise da série Trends + persistência em ``termos.tendencia_pytrends``.

A heurística de slope sobre os últimos pontos é intencionalmente simples; termos com
sazonalidade forte podem ser classificados de forma grosseira (melhoria futura: detrending).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from statistics import mean
from typing import Any
from uuid import UUID

import numpy as np
from pydantic import BaseModel

from ideiapages_research.clients.supabase import get_supabase
from ideiapages_research.settings import get_settings
from ideiapages_research.types.trends import TrendDataPoint, TrendsCollectResult


def _parse_iso_dt(raw: str) -> datetime | None:
    try:
        s = raw.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def should_skip_trend_refresh(
    tendencia_pytrends: dict[str, Any] | None,
    *,
    force: bool,
    cache_days: int | None = None,
) -> bool:
    """True se deve pular novo fetch (cache ainda válido)."""
    if force or not tendencia_pytrends:
        return False
    days = cache_days if cache_days is not None else get_settings().trend_cache_days
    raw = tendencia_pytrends.get("fetched_at")
    if not raw or not isinstance(raw, str):
        return False
    dt = _parse_iso_dt(raw)
    if dt is None:
        return False
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    age = datetime.now(UTC) - dt
    return age.days < days


def _classify_slope(slope: float, *, up: float, down: float) -> str:
    if slope > up:
        return "crescente"
    if slope < down:
        return "decrescente"
    return "estavel"


def _interesse_medio_12m_e_volume_proxy(
    serie: list[TrendDataPoint],
) -> tuple[float | None, int | None]:
    """Média do índice 0–100 (até 12 meses) e proxy mensal proporcional (ver settings)."""
    if not serie:
        return None, None
    vals = [p.interesse for p in serie]
    window = vals[-12:] if len(vals) >= 12 else vals
    avg = float(mean(window))
    s = get_settings()
    vmax = int(round(float(s.pytrends_volume_proxy_max) * (avg / 100.0)))
    return round(avg, 2), max(0, vmax)


def _build_trend_payload(result: TrendsCollectResult | None) -> dict[str, Any]:
    """Monta o JSONB completo (versão 1)."""
    fetched_at = datetime.now(UTC).isoformat()
    if result is None:
        return {"version": 1, "tendencia": "no_data", "fetched_at": fetched_at}

    s = get_settings()
    serie = result.serie
    if not serie:
        return {
            "version": 1,
            "geo": result.geo,
            "timeframe": result.timeframe,
            "fetched_at": fetched_at,
            "tendencia": "no_data",
            "slope": 0.0,
            "pico_mes": 1,
            "amplitude": 0.0,
            "serie": [],
            "interesse_medio_12m": None,
            "volume_proxy_metodo": "google_trends_indice_0_100",
            "rising_queries": [q.model_dump() for q in result.rising_queries],
            "top_queries": [q.model_dump() for q in result.top_queries],
        }
    vals = [p.interesse for p in serie]
    window = vals[-12:] if len(vals) >= 12 else vals
    xs = np.arange(len(window), dtype=float)
    if len(window) < 3:
        slope = 0.0
        tendencia = "estavel"
    else:
        slope = float(np.polyfit(xs, np.array(window, dtype=float), 1)[0])
        tendencia = _classify_slope(slope, up=s.trend_slope_up, down=s.trend_slope_down)

    by_month: dict[int, list[int]] = defaultdict(list)
    for p in serie:
        parts = p.data.split("-")
        if len(parts) == 2:
            try:
                by_month[int(parts[1])].append(p.interesse)
            except ValueError:
                continue
    avgs = {m: mean(v) for m, v in by_month.items() if v}
    pico_mes = int(max(avgs, key=avgs.get)) if avgs else 1
    amplitude = (max(vals) - min(vals)) / 100.0 if vals else 0.0
    im12, _vol_proxy = _interesse_medio_12m_e_volume_proxy(serie)

    return {
        "version": 1,
        "geo": result.geo,
        "timeframe": result.timeframe,
        "fetched_at": fetched_at,
        "tendencia": tendencia,
        "slope": round(slope, 4),
        "pico_mes": pico_mes,
        "amplitude": round(amplitude, 4),
        "serie": [p.model_dump() for p in serie],
        "interesse_medio_12m": im12,
        "volume_proxy_metodo": "google_trends_indice_0_100",
        "rising_queries": [q.model_dump() for q in result.rising_queries],
        "top_queries": [q.model_dump() for q in result.top_queries],
    }


class AnalysisReport(BaseModel):
    termo_id: UUID
    keyword: str
    skipped_cache: bool = False
    tendencia: str
    payload: dict[str, Any]
    persisted: bool
    cost_brl: float = 0.0


def analyze_and_persist(
    termo_id: UUID,
    keyword: str,
    result: TrendsCollectResult | None,
    *,
    dry_run: bool = False,
) -> AnalysisReport:
    """Calcula JSONB e opcionalmente persiste em ``termos.tendencia_pytrends``."""
    payload = _build_trend_payload(result)
    tendencia = str(payload.get("tendencia", "no_data"))
    if dry_run:
        return AnalysisReport(
            termo_id=termo_id,
            keyword=keyword,
            tendencia=tendencia,
            payload=payload,
            persisted=False,
            cost_brl=0.0,
        )

    sb = get_supabase()
    update_row: dict[str, Any] = {"tendencia_pytrends": payload}
    if result and result.serie:
        _im, vol_proxy = _interesse_medio_12m_e_volume_proxy(result.serie)
        if vol_proxy is not None:
            update_row["volume_estimado"] = vol_proxy

    sb.table("termos").update(update_row).eq("id", str(termo_id)).execute()
    return AnalysisReport(
        termo_id=termo_id,
        keyword=keyword,
        tendencia=tendencia,
        payload=payload,
        persisted=True,
        cost_brl=0.0,
    )
