"""Validação do schema BriefingSEO."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from ideiapages_research.behaviors.analyze_gaps.summarizer import (
    estimate_summary_tokens,
    summarize_competitor,
)
from ideiapages_research.types.briefing import BriefingSEO, CompetitorContent, CompetitorSummary

_H2_MIN = [
    {"h2": "A", "h3s": []},
    {"h2": "B", "h3s": []},
    {"h2": "C", "h3s": []},
]


def test_briefing_title_length() -> None:
    with pytest.raises(ValidationError):
        BriefingSEO.model_validate(
            {
                "version": 1,
                "title_seo": "x" * 61,
                "meta_description": "m" * 80,
                "h1_sugerido": "H1",
                "estrutura_h2_h3": _H2_MIN,
                "topicos_obrigatorios": ["t1"],
                "information_gain": {
                    "topicos_unicos_que_concorrentes_nao_tem": ["g1"],
                    "angulo_diferenciado": "ang",
                },
                "faq_sugerida": [],
                "cta_principal": "cta",
                "cta_secundario": None,
                "evidencias_externas_sugeridas": [],
                "schema_org_recomendados": ["Article"],
                "word_count_alvo": 400,
                "tom_de_voz": "neutro",
                "alertas_para_humano": [],
            }
        )


def test_word_count_minimum() -> None:
    with pytest.raises(ValidationError):
        BriefingSEO.model_validate(
            {
                "version": 1,
                "title_seo": "ok",
                "meta_description": "m" * 80,
                "h1_sugerido": "H1",
                "estrutura_h2_h3": _H2_MIN,
                "topicos_obrigatorios": ["t1"],
                "information_gain": {
                    "topicos_unicos_que_concorrentes_nao_tem": [],
                    "angulo_diferenciado": "x",
                },
                "faq_sugerida": [],
                "cta_principal": "c",
                "cta_secundario": None,
                "evidencias_externas_sugeridas": [],
                "schema_org_recomendados": [],
                "word_count_alvo": 200,
                "tom_de_voz": "t",
                "alertas_para_humano": [],
            }
        )


def test_summarize_competitor_snippet_cap() -> None:
    words = ("palavra " * 400).strip()
    md = "# T\n\n" + words + "\n\n## S\n\nmais texto."
    c = CompetitorContent(
        url="https://exemplo.com/p",
        titulo="T",
        posicao=1,
        markdown=md,
        word_count=500,
        headings_h2=["S"],
        headings_h3=["a", "b"],
        tem_faq=True,
        tem_tabela=False,
    )
    s = summarize_competitor(c)
    assert len(s.trecho_inicio) <= 520
    assert s.tem_faq is True
    assert len(s.headings_h3) <= 20


def test_estimate_summary_tokens_under_800_for_small_payload() -> None:
    summaries = [
        CompetitorSummary(
            url=f"https://exemplo.com/{i}",
            titulo="T",
            posicao=i,
            word_count=200,
            headings_h2=["h"],
            headings_h3=[],
            trecho_inicio="x" * 400,
            tem_faq=False,
            tem_tabela=False,
        )
        for i in range(1, 6)
    ]
    assert estimate_summary_tokens(summaries) < 800
