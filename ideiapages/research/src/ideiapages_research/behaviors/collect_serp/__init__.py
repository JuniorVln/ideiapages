"""Snapshot SERP (Google) via Apify."""

from ideiapages_research.behaviors.collect_serp.collector import (
    load_serp_exclusion_domains,
    log_metricas_serp,
    snapshot_serp_for_term,
)

__all__ = [
    "load_serp_exclusion_domains",
    "log_metricas_serp",
    "snapshot_serp_for_term",
]
