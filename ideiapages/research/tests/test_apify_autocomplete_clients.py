"""Testes unitários dos wrappers Apify (mock, sem rede)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from ideiapages_research.clients.apify import (
    ApifyAutocompleteClient,
    ApifyPAAClient,
    reset_apify_client_for_tests,
)


def test_autocomplete_client_maps_dataset() -> None:
    reset_apify_client_for_tests()
    mock_apify = MagicMock()
    actor = MagicMock()
    mock_apify.actor.return_value = actor
    actor.call.return_value = {"defaultDatasetId": "ds1"}
    ds = MagicMock()
    ds.iterate_items.return_value = [
        {
            "keyword": "foo bar",
            "position": 1,
            "relevance_score": 0.9,
            "seed": "foo",
        },
        {"keyword": "", "position": 2},
    ]
    mock_apify.dataset.return_value = ds

    with patch("ideiapages_research.clients.apify.get_settings") as gs:
        gs.return_value = MagicMock(usd_to_brl=5.0)
        c = ApifyAutocompleteClient(apify=mock_apify, wait_secs=1)
        out = c.collect("foo", geo="BR", lang="pt-BR", limit=10)

    assert len(out) == 1
    assert out[0].text == "foo bar"
    assert out[0].position == 1
    assert abs(c.last_call_cost_brl - 0.001 * 5.0) < 1e-9


def test_paa_client_extracts_questions() -> None:
    reset_apify_client_for_tests()
    mock_apify = MagicMock()
    actor = MagicMock()
    mock_apify.actor.return_value = actor
    actor.call.return_value = {"defaultDatasetId": "ds2"}
    ds = MagicMock()
    ds.iterate_items.return_value = [
        {
            "peopleAlsoAsk": [
                {"question": " O que é X? ", "answer": "A", "url": "https://exemplo"},
                {"question": "", "answer": None},
            ]
        }
    ]
    mock_apify.dataset.return_value = ds

    with patch("ideiapages_research.clients.apify.get_settings") as gs:
        gs.return_value = MagicMock(usd_to_brl=5.0)
        c = ApifyPAAClient(apify=mock_apify, wait_secs=1)
        out = c.collect("x", geo="BR", lang="pt-BR", limit=10)

    assert len(out) == 1
    assert out[0].question == "O que é X?"
    assert out[0].answer == "A"
    expected_usd = 0.001 + 0.0045
    assert abs(c.last_call_cost_brl - expected_usd * 5.0) < 1e-9
