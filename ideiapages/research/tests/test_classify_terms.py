"""Testes do classify-terms (sem rede / sem Claude)."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from ideiapages_research.behaviors.classify_terms import classifier as cf
from ideiapages_research.behaviors.classify_terms.classifier import load_prompt_bundle
from ideiapages_research.types.term import ClassifyLLMResponse, TermIntent


def test_extract_json_object_strips_fence() -> None:
    inner = {
        "classifications": [
            {
                "keyword": "whatsapp empresa",
                "intencao": "transacional",
                "score_conversao": 8,
                "tipo_pagina_recomendado": "landing",
                "cluster": "whatsapp b2b",
                "justificativa": "Busca com intenção de contratar solução.",
            }
        ]
    }
    wrapped = "```json\n" + json.dumps(inner, ensure_ascii=False) + "\n```"
    parsed = ClassifyLLMResponse.model_validate_json(cf._extract_json_object(wrapped))
    assert len(parsed.classifications) == 1
    assert parsed.classifications[0].intencao is TermIntent.TRANSACTIONAL


def test_classify_llm_response_rejects_extra_root_field() -> None:
    bad = '{"classifications": [], "extra": 1}'
    with pytest.raises(ValidationError):
        ClassifyLLMResponse.model_validate_json(cf._extract_json_object(bad))


def test_load_prompt_bundle_default_file() -> None:
    b = load_prompt_bundle()
    assert b.version >= 1
    assert "JSON" in b.system
    assert "{{product_facts}}" in b.user_template
    assert "{{keywords_batch}}" in b.user_template


def test_justificativa_suspeita_detects_unknown_price() -> None:
    facts = "| **Essencial** | R$ 179,90 |"
    assert cf._justificativa_suspeita("Plano por apenas R$ 99,00 mensais.", facts) is True
    assert cf._justificativa_suspeita("Consulte valores no site oficial.", facts) is False
    assert cf._justificativa_suspeita("Plano Essencial a partir de R$ 179,90.", facts) is False
