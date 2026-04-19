"""Wrapper do Claude (Anthropic) com retry e logging de custo."""

from __future__ import annotations

from anthropic import Anthropic, AsyncAnthropic

from ideiapages_research.settings import get_settings


_client: Anthropic | None = None
_async_client: AsyncAnthropic | None = None


def get_claude() -> Anthropic:
    global _client
    if _client is None:
        s = get_settings()
        _client = Anthropic(api_key=s.anthropic_api_key.get_secret_value())
    return _client


def get_claude_async() -> AsyncAnthropic:
    global _async_client
    if _async_client is None:
        s = get_settings()
        _async_client = AsyncAnthropic(api_key=s.anthropic_api_key.get_secret_value())
    return _async_client
