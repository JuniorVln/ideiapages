"""Wrapper do Supabase client (server-side, service_role)."""

from __future__ import annotations

from typing import Any

from supabase import Client, create_client

from ideiapages_research.settings import get_settings


_client: Client | None = None


def get_supabase() -> Client:
    """Singleton client com service_role key.

    NUNCA use isso em código que vai rodar no browser.
    """
    global _client
    if _client is None:
        s = get_settings()
        _client = create_client(
            s.supabase_url,
            s.supabase_service_role_key.get_secret_value(),
        )
    return _client


def upsert_term(keyword: str, **fields: Any) -> dict[str, Any]:
    """Helper de exemplo. Implementacao real virá no behavior collect-autocomplete."""
    raise NotImplementedError("Será implementado pelo agente python-collector-writer")
