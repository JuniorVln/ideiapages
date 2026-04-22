"""Testes collect-serp (sem Apify / sem Supabase)."""

from __future__ import annotations

from unittest.mock import MagicMock

from ideiapages_research.behaviors.collect_serp import collector as col
from ideiapages_research.types.serp import SerpOrganicItem


def test_filter_organic_excludes_client_domain() -> None:
    ex = {"ideiamultichat.com.br", "instagram.com"}
    items = [
        SerpOrganicItem(
            position=1,
            url="https://ideiamultichat.com.br/precos",
            title="a",
            meta_description=None,
        ),
        SerpOrganicItem(
            position=2,
            url="https://exemplo.com/x",
            title="b",
            meta_description="d",
        ),
    ]
    out = col._filter_organic(items, ex, top_n=10)
    assert len(out) == 1
    assert out[0].url == "https://exemplo.com/x"
    assert out[0].position == 1


def test_filter_organic_skips_google_search_urls() -> None:
    ex: set[str] = set()
    items = [
        SerpOrganicItem(
            position=1,
            url="https://www.google.com/search?q=foo",
            title="x",
            meta_description=None,
        ),
        SerpOrganicItem(position=2, url="https://ok.com/", title="y", meta_description=None),
    ]
    out = col._filter_organic(items, ex, top_n=10)
    assert len(out) == 1
    assert "ok.com" in out[0].url


def test_host_key_strips_www() -> None:
    assert col._host_key("https://WWW.Exemplo.COM/path") == "exemplo.com"


def test_load_serp_exclusion_domains_merges_extra_from_settings() -> None:
    s = MagicMock()
    s.serp_exclude_domains_extra = "foo.com, www.bar.org "
    domains = col.load_serp_exclusion_domains(s)
    assert "foo.com" in domains
    assert "bar.org" in domains
