"""Wrapper do Firecrawl client."""

from __future__ import annotations

from firecrawl import FirecrawlApp

from ideiapages_research.settings import get_settings


_client: FirecrawlApp | None = None


def get_firecrawl() -> FirecrawlApp:
    """Singleton client autenticado."""
    global _client
    if _client is None:
        s = get_settings()
        _client = FirecrawlApp(api_key=s.firecrawl_api_key.get_secret_value())
    return _client
