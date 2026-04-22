"""Wrapper do Apify client + actors usados no pipeline de research."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from apify_client import ApifyClient
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from ideiapages_research.settings import get_settings
from ideiapages_research.types.autocomplete import AutocompleteSuggestion, PAAQuestion
from ideiapages_research.types.serp import SerpCollectResult, SerpExtraPayload, SerpOrganicItem

_client: ApifyClient | None = None

# Preços de referência (USD, tier FREE aproximado — ajuste via documentação do actor).
# Autocomplete: https://apify.com/lofomachines/google-search-autocomplete-cheaper-faster-reliable/pricing
_AUTOCOMPLETE_USD_PER_RESULT = 0.001
# SERP Apify: https://apify.com/apify/google-search-scraper/pricing
_GSS_USD_PER_PAGE = 0.0045
_GSS_USD_ACTOR_START = 0.001


def get_apify() -> ApifyClient:
    """Singleton client autenticado."""
    global _client
    if _client is None:
        s = get_settings()
        _client = ApifyClient(s.apify_token.get_secret_value())
    return _client


def _is_retryable(exc: BaseException) -> bool:
    code = getattr(exc, "status_code", None)
    if code in {408, 425, 429, 500, 502, 503, 504}:
        return True
    msg = str(exc).lower()
    return "429" in msg or "rate limit" in msg or "timeout" in msg


def _run_actor_call(
    apify: ApifyClient,
    actor_id: str,
    run_input: dict[str, Any],
    *,
    wait_secs: int,
) -> dict[str, Any]:
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=90),
        retry=retry_if_exception(_is_retryable),
        reraise=True,
    )
    def _call() -> dict[str, Any]:
        return apify.actor(actor_id).call(run_input=run_input, wait_secs=wait_secs)

    return _call()


def _iter_dataset_items(apify: ApifyClient, dataset_id: str) -> Iterator[dict[str, Any]]:
    yield from apify.dataset(dataset_id).iterate_items()


def _geo_to_autocomplete_country(geo: str) -> str:
    g = geo.strip().lower()
    if len(g) == 2:
        return g
    mapping = {"br": "br", "pt-br": "br", "pt_br": "br"}
    return mapping.get(g, "br")


def _lang_to_autocomplete_language(lang: str) -> str:
    lang_key = lang.strip().lower().replace("_", "-")
    if lang_key in {"pt-br", "pt_br", "pt"}:
        return "pt"
    if lang_key == "en":
        return "en"
    return lang_key.split("-", maxsplit=1)[0] if "-" in lang_key else lang_key[:2]


def _geo_to_gss_country_code(geo: str) -> str:
    g = geo.strip().lower()
    if len(g) == 2:
        return g
    return "br"


def _lang_to_gss_language_code(lang: str) -> str:
    raw = lang.strip()
    if raw.lower() in {"pt-br", "pt_br"}:
        return "pt-BR"
    return raw or "pt-BR"


class ApifyAutocompleteClient:
    """Actor: Google Autocomplete (sugestões da barra de busca).

    Store: https://apify.com/lofomachines/google-search-autocomplete-cheaper-faster-reliable
    """

    ACTOR_ID = "lofomachines/google-search-autocomplete-cheaper-faster-reliable"

    def __init__(
        self,
        apify: ApifyClient | None = None,
        *,
        wait_secs: int = 300,
        usd_per_result: float = _AUTOCOMPLETE_USD_PER_RESULT,
    ) -> None:
        self._apify = apify or get_apify()
        self._wait_secs = wait_secs
        self._usd_per_result = usd_per_result
        self.last_call_cost_brl: float = 0.0

    def collect(self, seed: str, geo: str, lang: str, limit: int) -> list[AutocompleteSuggestion]:
        """Dispara o actor e devolve sugestões (limitadas a ``limit``)."""
        country = _geo_to_autocomplete_country(geo)
        language = _lang_to_autocomplete_language(lang)
        cap = max(1, min(limit, 500))
        run_input: dict[str, Any] = {
            "seedPhrases": [seed],
            "country": country,
            "language": language,
            "expansionMode": "none",
            "maxResults": cap,
            "maxLetters": 8,
            "includeNumbers": False,
            "delayBetweenRequests": 250,
            "outputFormat": "detailed",
        }
        run = _run_actor_call(self._apify, self.ACTOR_ID, run_input, wait_secs=self._wait_secs)
        dataset_id = run["defaultDatasetId"]
        out: list[AutocompleteSuggestion] = []
        for row in _iter_dataset_items(self._apify, dataset_id):
            text = (row.get("keyword") or "").strip()
            if not text:
                continue
            pos = row.get("position")
            rel = row.get("relevance_score")
            out.append(
                AutocompleteSuggestion(
                    text=text,
                    position=int(pos) if isinstance(pos, int | float) else None,
                    relevance_score=float(rel) if isinstance(rel, int | float) else None,
                    seed=row.get("seed") or seed,
                )
            )
            if len(out) >= cap:
                break

        usd = self._usd_per_result * len(out)
        self.last_call_cost_brl = usd * get_settings().usd_to_brl
        return out


class ApifyPAAClient:
    """People Also Ask via Google Search Scraper (1 página).

    Store: https://apify.com/apify/google-search-scraper
    """

    ACTOR_ID = "apify/google-search-scraper"

    def __init__(
        self,
        apify: ApifyClient | None = None,
        *,
        wait_secs: int = 300,
        usd_per_page: float = _GSS_USD_PER_PAGE,
        usd_actor_start: float = _GSS_USD_ACTOR_START,
    ) -> None:
        self._apify = apify or get_apify()
        self._wait_secs = wait_secs
        self._usd_per_page = usd_per_page
        self._usd_actor_start = usd_actor_start
        self.last_call_cost_brl: float = 0.0

    def collect(self, seed: str, geo: str, lang: str, limit: int) -> list[PAAQuestion]:
        """Extrai até ``limit`` perguntas PAA da primeira página do SERP."""
        cap = max(1, min(limit, 500))
        run_input: dict[str, Any] = {
            "queries": seed,
            "maxPagesPerQuery": 1,
            "resultsPerPage": 10,
            "countryCode": _geo_to_gss_country_code(geo),
            "languageCode": _lang_to_gss_language_code(lang),
            "mobileResults": False,
            "saveHtml": False,
            "saveHtmlToKeyValueStore": False,
        }
        run = _run_actor_call(self._apify, self.ACTOR_ID, run_input, wait_secs=self._wait_secs)
        dataset_id = run["defaultDatasetId"]
        out: list[PAAQuestion] = []
        for row in _iter_dataset_items(self._apify, dataset_id):
            for p in row.get("peopleAlsoAsk") or []:
                if not isinstance(p, dict):
                    continue
                q = (p.get("question") or "").strip()
                if not q:
                    continue
                ans = p.get("answer")
                ans_s = ans.strip() if isinstance(ans, str) else None
                u = p.get("url")
                u_s = u.strip() if isinstance(u, str) else None
                out.append(PAAQuestion(question=q, answer=ans_s, url=u_s))
                if len(out) >= cap:
                    return self._finalize_cost(out)
        return self._finalize_cost(out)

    def _finalize_cost(self, items: list[PAAQuestion]) -> list[PAAQuestion]:
        usd = self._usd_actor_start + self._usd_per_page * 1
        self.last_call_cost_brl = usd * get_settings().usd_to_brl
        return items


class ApifySerpClient:
    """Top N organicos via Google Search Scraper (Apify oficial).

    Store: https://apify.com/apify/google-search-scraper
    """

    ACTOR_ID = "apify/google-search-scraper"

    def __init__(
        self,
        apify: ApifyClient | None = None,
        *,
        wait_secs: int = 300,
        usd_per_page: float = _GSS_USD_PER_PAGE,
        usd_actor_start: float = _GSS_USD_ACTOR_START,
    ) -> None:
        self._apify = apify or get_apify()
        self._wait_secs = wait_secs
        self._usd_per_page = usd_per_page
        self._usd_actor_start = usd_actor_start
        self.last_call_cost_brl: float = 0.0

    def collect(
        self,
        keyword: str,
        *,
        geo: str = "BR",
        lang: str = "pt-BR",
        top_n: int = 10,
    ) -> SerpCollectResult:
        tn = max(1, min(int(top_n), 50))
        fetch_cap = min(50, tn + 15)
        pages = max(1, (fetch_cap + 9) // 10)
        run_input: dict[str, Any] = {
            "queries": keyword,
            "maxPagesPerQuery": pages,
            "resultsPerPage": 10,
            "countryCode": _geo_to_gss_country_code(geo),
            "languageCode": _lang_to_gss_language_code(lang),
            "mobileResults": False,
            "saveHtml": False,
            "saveHtmlToKeyValueStore": False,
        }
        run = _run_actor_call(self._apify, self.ACTOR_ID, run_input, wait_secs=self._wait_secs)
        dataset_id = run["defaultDatasetId"]
        raw_items: list[dict[str, Any]] = list(_iter_dataset_items(self._apify, dataset_id))
        organic_raw: list[dict[str, Any]] = []
        seen_org_urls: set[str] = set()

        def take_organic(obj: dict[str, Any]) -> None:
            if obj.get("type", "organic") != "organic":
                return
            u = (obj.get("url") or "").strip()
            if not u or u in seen_org_urls:
                return
            seen_org_urls.add(u)
            organic_raw.append(obj)

        paa_acc: list[dict[str, Any]] = []
        rel_acc: list[dict[str, Any]] = []
        fs_acc: dict[str, Any] | None = None
        for row in raw_items:
            if row.get("type") == "organic":
                take_organic(row)
            for o in row.get("organicResults") or []:
                if isinstance(o, dict):
                    take_organic(o)
            if not paa_acc:
                paa = row.get("peopleAlsoAsk") or []
                if isinstance(paa, list):
                    paa_acc = [p for p in paa if isinstance(p, dict)]
            if not rel_acc:
                rel = row.get("relatedQueries") or row.get("relatedSearches") or []
                if isinstance(rel, list):
                    rel_acc = [p for p in rel if isinstance(p, dict)]
            if fs_acc is None:
                fs = row.get("featuredSnippet")
                if isinstance(fs, dict):
                    fs_acc = fs

        extras = SerpExtraPayload(
            people_also_ask=paa_acc,
            related_searches=rel_acc,
            featured_snippet=fs_acc,
        )

        organic_raw.sort(key=lambda x: int(x.get("position") or 999))

        out_org: list[SerpOrganicItem] = []
        seen_urls: set[str] = set()
        for o in organic_raw:
            if len(out_org) >= fetch_cap:
                break
            url = (o.get("url") or "").strip()
            if not url or url in seen_urls:
                continue
            pos_o = o.get("position")
            try:
                _ = int(pos_o) if pos_o is not None else len(out_org) + 1
            except (TypeError, ValueError):
                continue
            desc = o.get("description")
            if not isinstance(desc, str):
                desc = None
            title = o.get("title")
            if not isinstance(title, str):
                title = None
            out_org.append(
                SerpOrganicItem(
                    position=len(out_org) + 1,
                    url=url,
                    title=title,
                    meta_description=desc,
                )
            )
            seen_urls.add(url)

        usd = self._usd_actor_start + self._usd_per_page * pages
        self.last_call_cost_brl = round(usd * get_settings().usd_to_brl, 4)

        return SerpCollectResult(
            keyword=keyword,
            organic=out_org,
            extras=extras,
            raw_dataset_items=raw_items,
            estimated_cost_brl=self.last_call_cost_brl,
        )


def reset_apify_client_for_tests() -> None:
    """Limpa singleton (apenas testes)."""
    global _client
    _client = None
