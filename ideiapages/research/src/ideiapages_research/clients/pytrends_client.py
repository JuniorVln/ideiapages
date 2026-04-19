"""Wrapper do pytrends (Google Trends nao-oficial)."""

from __future__ import annotations

from pytrends.request import TrendReq


_client: TrendReq | None = None


def get_pytrends(hl: str = "pt-BR", tz: int = 180) -> TrendReq:
    """Singleton TrendReq config para Brasil (UTC-3)."""
    global _client
    if _client is None:
        _client = TrendReq(hl=hl, tz=tz)
    return _client
