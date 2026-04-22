"""Orquestração end-to-end da Fase 0 (research)."""

from ideiapages_research.behaviors.pipeline.report import write_fase_zero_report
from ideiapages_research.behaviors.pipeline.runner import PipelineRunSummary, run_fase_zero_pipeline
from ideiapages_research.behaviors.pipeline.status import (
    FaseZeroMetrics,
    SuggestedStep,
    fetch_fase_zero_metrics,
    metrics_to_report_lines,
    suggest_fase_zero_steps,
)

__all__ = [
    "FaseZeroMetrics",
    "PipelineRunSummary",
    "SuggestedStep",
    "fetch_fase_zero_metrics",
    "metrics_to_report_lines",
    "run_fase_zero_pipeline",
    "suggest_fase_zero_steps",
    "write_fase_zero_report",
]
