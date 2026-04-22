"""Testes da lógica de normalização / coleta (mock Supabase + Apify)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from ideiapages_research.behaviors.collect_autocomplete.collector import (
    collect_for_seed,
    load_stopwords,
)
from ideiapages_research.clients.apify import reset_apify_client_for_tests
from ideiapages_research.text import normalize_keyword
from ideiapages_research.types.autocomplete import AutocompleteSuggestion, PAAQuestion


def test_normalize_keyword_strips_accents() -> None:
    assert normalize_keyword("  Atenção  ") == "atencao"


def test_load_stopwords_nonempty() -> None:
    sw = load_stopwords()
    assert "o" in sw
    assert "como" in sw


def test_collect_for_seed_dry_run_no_supabase_writes(tmp_path, monkeypatch) -> None:
    reset_apify_client_for_tests()
    monkeypatch.setattr(
        "ideiapages_research.behaviors.collect_autocomplete.collector.PROJECT_ROOT",
        tmp_path,
    )
    (tmp_path / "references").mkdir(parents=True)
    (tmp_path / "references" / "stopwords-pt-br.txt").write_text("como\n", encoding="utf-8")

    ac = MagicMock()
    ac.last_call_cost_brl = 0.01
    ac.collect.return_value = [
        AutocompleteSuggestion(text="Alpha seed extra", seed="alpha"),
        AutocompleteSuggestion(text="como fazer", seed="alpha"),
    ]
    paa = MagicMock()
    paa.last_call_cost_brl = 0.02
    paa.collect.return_value = [PAAQuestion(question="Alpha seed extra?")]

    with (
        patch(
            "ideiapages_research.behaviors.collect_autocomplete.collector.get_supabase",
        ) as gs_supa,
        patch(
            "ideiapages_research.behaviors.collect_autocomplete.collector.get_settings",
        ) as gs,
        patch("ideiapages_research.clients.apify.get_settings") as gsa,
    ):
        gs.return_value = MagicMock(collect_autocomplete_cache_days=7, usd_to_brl=5.0)
        gsa.return_value = MagicMock(usd_to_brl=5.0)
        # reload stopwords from tmp
        import ideiapages_research.behaviors.collect_autocomplete.collector as col

        monkeypatch.setattr(col, "_STOPWORDS", None)
        report = collect_for_seed(
            "alpha",
            limit=50,
            dry_run=True,
            force=True,
            autocomplete_client=ac,
            paa_client=paa,
        )

    gs_supa.assert_not_called()
    assert report.dry_run is True
    assert report.inserted == 0
    assert report.discarded >= 1
    assert report.total_raw_autocomplete == 2
    raw_dir = tmp_path / "research" / "data" / "raw" / "autocomplete"
    assert raw_dir.is_dir()
    assert any(p.suffix == ".json" for p in raw_dir.iterdir())
