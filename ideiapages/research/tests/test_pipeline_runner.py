"""Sanidade do runner da Fase 0 (sem rede)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

from ideiapages_research.behaviors.pipeline.runner import run_fase_zero_pipeline


def test_run_pipeline_missing_seed(tmp_path: Path) -> None:
    missing = tmp_path / "nope.json"
    sb = MagicMock()
    s = run_fase_zero_pipeline(seed_file=missing, sb=sb, skip_report=True)
    assert s.errors
    assert "não encontrado" in s.errors[0]


def test_run_pipeline_invalid_json(tmp_path: Path) -> None:
    p = tmp_path / "bad.json"
    p.write_text("{not json", encoding="utf-8")
    s = run_fase_zero_pipeline(seed_file=p, sb=MagicMock(), skip_report=True)
    assert any("inválido" in e for e in s.errors)


def test_run_pipeline_empty_seeds(tmp_path: Path) -> None:
    p = tmp_path / "empty.json"
    p.write_text('{"seeds_termos": []}', encoding="utf-8")
    s = run_fase_zero_pipeline(seed_file=p, sb=MagicMock(), skip_report=True)
    assert any("inválido" in e for e in s.errors)
