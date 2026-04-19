"""Wrapper do Apify client."""

from __future__ import annotations

from apify_client import ApifyClient

from ideiapages_research.settings import get_settings


_client: ApifyClient | None = None


def get_apify() -> ApifyClient:
    """Singleton client autenticado."""
    global _client
    if _client is None:
        s = get_settings()
        _client = ApifyClient(s.apify_token.get_secret_value())
    return _client
