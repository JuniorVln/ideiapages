"""Testes do analyzer de Trends (sem rede)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch
from uuid import uuid4

from ideiapages_research.behaviors.collect_trends import analyzer as an
from ideiapages_research.behaviors.collect_trends.analyzer import (
    analyze_and_persist,
    should_skip_trend_refresh,
)
from ideiapages_research.types.trends import RelatedQuery, TrendDataPoint, TrendsCollectResult


def test_should_skip_fresh_cache() -> None:
    recent = {"fetched_at": (datetime.now(UTC) - timedelta(days=5)).isoformat()}
    assert should_skip_trend_refresh(recent, force=False, cache_days=30) is True
    assert should_skip_trend_refresh(recent, force=True, cache_days=30) is False


def test_should_skip_stale_cache() -> None:
    old = {"fetched_at": (datetime.now(UTC) - timedelta(days=40)).isoformat()}
    assert should_skip_trend_refresh(old, force=False, cache_days=30) is False


def test_build_payload_crescente() -> None:
    serie = [TrendDataPoint(data=f"2024-{m:02d}", interesse=m * 3) for m in range(1, 13)]
    r = TrendsCollectResult(
        keyword="x",
        geo="BR",
        timeframe="today 12-m",
        serie=serie,
        rising_queries=[RelatedQuery(query="a", value="100")],
        top_queries=[],
    )
    with patch("ideiapages_research.behaviors.collect_trends.analyzer.get_settings") as gs:
        gs.return_value = MagicMock(
            trend_slope_up=0.5,
            trend_slope_down=-0.5,
            pytrends_volume_proxy_max=10_000,
        )
        payload = an._build_trend_payload(r)
    assert payload["version"] == 1
    assert payload["tendencia"] == "crescente"
    assert payload["pico_mes"] == 12
    assert len(payload["serie"]) == 12
    assert payload["interesse_medio_12m"] == 19.5  # média de 3..36 (m=1..12)


def test_build_payload_no_data_none() -> None:
    p = an._build_trend_payload(None)
    assert p["tendencia"] == "no_data"
    assert p["version"] == 1


def test_analyze_and_persist_dry_run() -> None:
    r = TrendsCollectResult(
        keyword="k",
        geo="BR",
        timeframe="today 12-m",
        serie=[TrendDataPoint(data="2024-01", interesse=50)],
        rising_queries=[],
        top_queries=[],
    )
    tid = uuid4()
    with patch("ideiapages_research.behaviors.collect_trends.analyzer.get_settings") as gs:
        gs.return_value = MagicMock(
            trend_slope_up=0.5,
            trend_slope_down=-0.5,
            pytrends_volume_proxy_max=10_000,
        )
        rep = analyze_and_persist(tid, "k", r, dry_run=True)
    assert rep.persisted is False
    assert rep.tendencia == "estavel"


def test_analyze_and_persist_writes_supabase() -> None:
    r = TrendsCollectResult(
        keyword="k",
        geo="BR",
        timeframe="today 12-m",
        serie=[TrendDataPoint(data="2024-01", interesse=50)],
        rising_queries=[],
        top_queries=[],
    )
    tid = uuid4()
    mock_table = MagicMock()
    sb = MagicMock()
    sb.table.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock()
    supa = "ideiapages_research.behaviors.collect_trends.analyzer.get_supabase"
    sett = "ideiapages_research.behaviors.collect_trends.analyzer.get_settings"
    with (
        patch(supa, return_value=sb),
        patch(sett) as gs,
    ):
        gs.return_value = MagicMock(
            trend_slope_up=0.5,
            trend_slope_down=-0.5,
            pytrends_volume_proxy_max=10_000,
        )
        rep = analyze_and_persist(tid, "k", r, dry_run=False)
    assert rep.persisted is True
    sb.table.assert_called_with("termos")
    mock_table.update.assert_called_once()
    call_kw = mock_table.update.call_args[0][0]
    assert call_kw["volume_estimado"] == 5_000
    assert "tendencia_pytrends" in call_kw
