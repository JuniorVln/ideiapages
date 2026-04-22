"""Wrapper do Firecrawl client (v2) com retry, timeout e heuristica de paywall."""

from __future__ import annotations

import re
from typing import Any

from firecrawl import FirecrawlApp
from firecrawl.v2.utils.error_handler import FirecrawlError
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from ideiapages_research.settings import get_settings
from ideiapages_research.types.competitor import ScrapedPage

_client: FirecrawlApp | None = None

_PAYWALL_HINTS = re.compile(
    r"(subscribe|paywall|assine|assinatura|cadastre-se|sign in|log in|faça login|"
    r"conteúdo exclusivo|content locked)",
    re.IGNORECASE,
)


def get_firecrawl() -> FirecrawlApp:
    """Singleton client autenticado (alias ``Firecrawl``/v2)."""
    global _client
    if _client is None:
        s = get_settings()
        _client = FirecrawlApp(api_key=s.firecrawl_api_key.get_secret_value())
    return _client


def _fc_retryable(exc: BaseException) -> bool:
    if isinstance(exc, FirecrawlError):
        code = exc.status_code or 0
        return code >= 500 or code == 429 or code == 408
    return False


def _paywall_heuristic(markdown: str) -> bool:
    if len(markdown) >= 500:
        return False
    return bool(_PAYWALL_HINTS.search(markdown))


def scrape_url(
    url: str,
    *,
    timeout_ms: int | None = None,
    max_chars: int | None = None,
) -> ScrapedPage:
    """Raspa uma URL (markdown + html opcional). Custo aproximado em BRL."""
    s = get_settings()
    fc = get_firecrawl()
    limit = max_chars if max_chars is not None else s.scrape_max_markdown_chars
    t_out = timeout_ms if timeout_ms is not None else s.firecrawl_timeout_ms

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.7, min=1, max=20),
        retry=retry_if_exception(_fc_retryable),
        reraise=True,
    )
    def _call() -> Any:
        return fc.scrape(
            url,
            formats=["markdown", "html"],
            only_main_content=True,
            timeout=int(t_out),
        )

    doc = _call()
    md = (doc.markdown or "").strip()
    truncated = False
    if len(md) > limit:
        md = md[:limit]
        truncated = True
    html = doc.html
    warn = getattr(doc, "warning", None)
    meta = doc.metadata_typed
    if getattr(meta, "error", None):
        warn = (warn or "") + " " + str(meta.error)
    det_lang: str | None = None
    if meta.language:
        det_lang = str(meta.language)[:5]

    paywalled = _paywall_heuristic(md)
    usd = s.firecrawl_scrape_usd
    cost = round(usd * s.usd_to_brl, 4)

    return ScrapedPage(
        url=url,
        markdown=md,
        html=html if isinstance(html, str) else None,
        paywalled=paywalled,
        truncated=truncated,
        warning=warn.strip() if isinstance(warn, str) and warn.strip() else None,
        detected_language=det_lang,
        estimated_cost_brl=cost,
    )
