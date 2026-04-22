"""Raspagem de concorrentes (Firecrawl) a partir de snapshots SERP."""

from ideiapages_research.behaviors.scrape_competitors.extractor import extract_structure
from ideiapages_research.behaviors.scrape_competitors.scraper import (
    load_serp_group_by_anchor,
    load_serp_group_latest_termo,
    scrape_competitors_for_serp_rows,
)

__all__ = [
    "extract_structure",
    "load_serp_group_by_anchor",
    "load_serp_group_latest_termo",
    "scrape_competitors_for_serp_rows",
]
