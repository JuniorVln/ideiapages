"""Wrapper do pytrends (Google Trends não oficial).

Documentação da lib: https://github.com/pat310/google-trends-api (PyPI: pytrends)

Comportamento:
- ``fetch`` devolve ``TrendsCollectResult`` com série mensal (média) e queries relacionadas,
  ou ``None`` quando o Trends não tem dados para a keyword (DataFrame vazio).
- HTTP 429/5xx: até 3 tentativas com backoff 5s / 15s / 45s.
- Após 3 falhas consecutivas (entre chamadas, após esgotar retries), levanta
  :class:`PyTrendsBannedError` — útil para pausar o batch no CLI.

Custo: R$ 0,00 (API não oficial, sem cobrança por requisição).
"""

from __future__ import annotations

import threading
import time
from typing import Any

import pandas as pd
import requests
from pytrends.request import TrendReq

from ideiapages_research.settings import get_settings
from ideiapages_research.types.trends import RelatedQuery, TrendDataPoint, TrendsCollectResult

_client: TrendReq | None = None


class PyTrendsBannedError(Exception):
    """Possível ban ou bloqueio após várias falhas consecutivas."""


def get_pytrends(hl: str = "pt-BR", tz: int = 180) -> TrendReq:
    """Singleton TrendReq legado (preferir :class:`PyTrendsClient`)."""
    global _client
    if _client is None:
        _client = TrendReq(hl=hl, tz=tz)
    return _client


def reset_pytrends_singleton_for_tests() -> None:
    global _client
    _client = None


def _is_retryable_http_error(exc: BaseException) -> bool:
    if isinstance(exc, requests.HTTPError):
        resp = exc.response
        return resp is not None and resp.status_code in (429, 500, 502, 503, 504)
    return False


def _monthly_series_from_interest_df(df: pd.DataFrame, keyword: str) -> list[TrendDataPoint]:
    if df.empty or keyword not in df.columns:
        return []
    work = df[[keyword]].copy()
    if isinstance(work.index, pd.DatetimeIndex):
        work.index = work.index.tz_localize(None) if work.index.tz else work.index
    monthly = work[keyword].groupby(work.index.to_period("M")).mean()
    out: list[TrendDataPoint] = []
    for period, val in monthly.items():
        if pd.isna(val):
            continue
        p = period
        label = f"{p.year}-{p.month:02d}"
        out.append(TrendDataPoint(data=label, interesse=int(round(float(val)))))
    return sorted(out, key=lambda x: x.data)


def _related_list(df: pd.DataFrame | None, *, limit: int = 5) -> list[RelatedQuery]:
    if df is None or df.empty:
        return []
    rows: list[RelatedQuery] = []
    for _, row in df.head(limit).iterrows():
        q = str(row.get("query", "")).strip()
        if not q:
            continue
        raw_v = row.get("value", "")
        v = raw_v if isinstance(raw_v, str) else str(raw_v)
        rows.append(RelatedQuery(query=q, value=v))
    return rows


class PyTrendsClient:
    """Cliente resiliente com intervalo mínimo entre chamadas e retries."""

    def __init__(
        self,
        *,
        hl: str = "pt-BR",
        tz: int = 180,
        min_interval_s: float | None = None,
    ) -> None:
        s = get_settings()
        self._trend = TrendReq(hl=hl, tz=tz)
        self._min_interval = (
            float(min_interval_s)
            if min_interval_s is not None
            else float(s.pytrends_min_interval_s)
        )
        self._lock = threading.Lock()
        self._last_call_mono: float = 0.0
        self._consecutive_failures = 0

    def reset_consecutive_failures(self) -> None:
        """Zera contador de falhas (ex.: após pausa longa no batch)."""
        self._consecutive_failures = 0

    def _throttle(self) -> None:
        with self._lock:
            now = time.monotonic()
            wait = self._min_interval - (now - self._last_call_mono)
            if wait > 0:
                time.sleep(wait)

    def _mark_called(self) -> None:
        with self._lock:
            self._last_call_mono = time.monotonic()

    def fetch(
        self,
        keyword: str,
        *,
        geo: str = "BR",
        timeframe: str = "today 12-m",
        cat: int = 0,
    ) -> TrendsCollectResult | None:
        """Busca interesse ao longo do tempo + related queries.

        Retorna ``None`` se não houver série (keyword sem dados).
        """
        backoff = (5.0, 15.0, 45.0)
        for attempt in range(3):
            try:
                self._throttle()
                kw = keyword.strip()
                self._trend.build_payload([kw], cat=cat, timeframe=timeframe, geo=geo)
                iot = self._trend.interest_over_time()
                related: dict[str, Any] = self._trend.related_queries()
                self._mark_called()

                if iot is None or iot.empty:
                    self._consecutive_failures = 0
                    return None

                if "isPartial" in iot.columns:
                    iot = iot.drop(columns=["isPartial"])

                serie = _monthly_series_from_interest_df(iot, kw)
                bucket = related.get(kw) or {}
                rising = _related_list(bucket.get("rising"), limit=5)
                top = _related_list(bucket.get("top"), limit=5)

                self._consecutive_failures = 0
                return TrendsCollectResult(
                    keyword=kw,
                    geo=geo,
                    timeframe=timeframe,
                    serie=serie,
                    rising_queries=rising,
                    top_queries=top,
                )
            except Exception as e:
                if attempt < 2 and _is_retryable_http_error(e):
                    time.sleep(backoff[attempt])
                    continue
                self._consecutive_failures += 1
                if self._consecutive_failures >= 3:
                    raise PyTrendsBannedError(str(e)) from e
                raise
        raise AssertionError("pytrends: loop de fetch terminou sem retorno")
