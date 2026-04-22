"""Classificação de termos (intenção, score, cluster) via Claude Haiku."""

from ideiapages_research.behaviors.classify_terms.classifier import (
    classify_batch,
    fetch_terms_for_classify,
    load_product_facts,
    load_prompt_bundle,
)

__all__ = [
    "classify_batch",
    "fetch_terms_for_classify",
    "load_product_facts",
    "load_prompt_bundle",
]
