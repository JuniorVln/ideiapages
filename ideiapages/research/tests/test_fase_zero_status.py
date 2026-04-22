"""Sugestões do funil Fase 0 (sem Supabase)."""

from __future__ import annotations

from ideiapages_research.behaviors.pipeline.status import FaseZeroMetrics, suggest_fase_zero_steps


def test_suggest_classify_when_pending() -> None:
    m = FaseZeroMetrics(
        total_termos=5,
        by_status={"coletado": 5},
        pending_classify=5,
        briefings_seo_total=0,
        briefing_pronto=0,
    )
    steps = suggest_fase_zero_steps(m)
    assert "classify-terms" in steps[0].command


def test_suggest_scrape_when_serp_ok() -> None:
    m = FaseZeroMetrics(
        total_termos=3,
        by_status={"snapshot_serp_ok": 3},
        pending_classify=0,
        briefings_seo_total=0,
        briefing_pronto=0,
    )
    steps = suggest_fase_zero_steps(m)
    cmds = " ".join(s.command for s in steps)
    assert "scrape-competitors" in cmds


def test_briefing_meta_when_enough() -> None:
    m = FaseZeroMetrics(
        total_termos=25,
        by_status={"briefing_pronto": 25},
        pending_classify=0,
        briefings_seo_total=25,
        briefing_pronto=25,
    )
    steps = suggest_fase_zero_steps(m)
    assert any("critério" in s.title.lower() for s in steps)
