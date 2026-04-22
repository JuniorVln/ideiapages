"""Tipos relacionados a termos de busca."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TermSource(StrEnum):
    AUTOCOMPLETE = "autocomplete"
    PAA = "paa"
    SEED = "seed"
    RELATED = "related"


class TermIntent(StrEnum):
    INFORMATIONAL = "informacional"
    TRANSACTIONAL = "transacional"
    COMPARATIVE = "comparativa"
    NAVIGATIONAL = "navegacional"


class PageType(StrEnum):
    LANDING = "landing"
    BLOG = "blog"
    COMPARISON = "comparison"
    FAQ = "faq"
    GUIDE = "guide"


class TermStatus(StrEnum):
    COLLECTED = "coletado"
    ANALYZED = "analisado"
    PRIORITIZED = "priorizado"
    DISCARDED = "descartado"


class TermInput(BaseModel):
    """Input para inserir um novo termo."""

    keyword: str = Field(..., min_length=2, max_length=200)
    fonte: TermSource


class TermClassification(BaseModel):
    """Output da classificação por LLM."""

    model_config = ConfigDict(extra="forbid")

    keyword: str
    intencao: TermIntent
    score_conversao: int = Field(..., ge=1, le=10)
    tipo_pagina_recomendado: PageType
    cluster: str = Field(..., max_length=200)
    justificativa: str = Field(..., max_length=500)


class ClassifyLLMResponse(BaseModel):
    """JSON raiz retornado pelo modelo."""

    model_config = ConfigDict(extra="forbid")

    classifications: list[TermClassification]


class ClassifyBatchInput(BaseModel):
    """Entrada explícita de um lote (testes / chamadas programáticas)."""

    termos: list[UUID]
    keywords: list[str]


class ClassifyBatchResult(BaseModel):
    """Agregado após processar um lote via API."""

    batch_index: int
    processed: int
    succeeded: int
    failed: int
    cost_brl: float
    score_histogram: dict[int, int] = Field(default_factory=dict)
    cluster_top: dict[str, int] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)


class TermRecord(BaseModel):
    """Termo como vem do Supabase."""

    id: UUID
    keyword: str
    fonte: TermSource
    volume_estimado: int | None = None
    dificuldade: int | None = None
    intencao: TermIntent | None = None
    score_conversao: int | None = None
    cluster: str | None = None
    tipo_pagina_recomendado: PageType | None = None
    status: TermStatus = TermStatus.COLLECTED
    created_at: datetime
    updated_at: datetime
