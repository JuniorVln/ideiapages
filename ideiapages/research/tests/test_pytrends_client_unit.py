"""Testes do PyTrendsClient com TrendReq mockado."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pandas as pd

from ideiapages_research.clients.pytrends_client import PyTrendsClient


def test_fetch_returns_monthly_series() -> None:
    mock_tr = MagicMock()
    idx = pd.date_range("2024-01-01", periods=12, freq="W-MON")
    df = pd.DataFrame({"test kw": range(12, 24)}, index=idx)
    mock_tr.interest_over_time.return_value = df
    mock_tr.related_queries.return_value = {
        "test kw": {
            "rising": pd.DataFrame([{"query": "q1", "value": "50"}]),
            "top": None,
        }
    }

    with (
        patch("ideiapages_research.clients.pytrends_client.TrendReq", return_value=mock_tr),
        patch("ideiapages_research.clients.pytrends_client.get_settings") as gs,
    ):
        gs.return_value = MagicMock(pytrends_min_interval_s=0.0)
        c = PyTrendsClient(min_interval_s=0.0)
        out = c.fetch("test kw", geo="BR", timeframe="today 12-m")

    assert out is not None
    assert len(out.serie) >= 1
    assert out.rising_queries[0].query == "q1"


def test_fetch_empty_is_none() -> None:
    mock_tr = MagicMock()
    mock_tr.interest_over_time.return_value = pd.DataFrame()

    with (
        patch("ideiapages_research.clients.pytrends_client.TrendReq", return_value=mock_tr),
        patch("ideiapages_research.clients.pytrends_client.get_settings") as gs,
    ):
        gs.return_value = MagicMock(pytrends_min_interval_s=0.0)
        c = PyTrendsClient(min_interval_s=0.0)
        assert c.fetch("nada aqui") is None
