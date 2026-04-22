"""Tipos para coleta de SERP (Google via Apify)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SerpOrganicItem(BaseModel):
    """Um resultado organico apos filtros (posicao renumerada 1..N)."""

    position: int = Field(..., ge=1, le=50)
    url: str
    title: str | None = None
    meta_description: str | None = None


class SerpCollectInput(BaseModel):
    """Parametros de uma coleta SERP."""

    keyword: str = Field(..., min_length=2, max_length=200)
    geo: str = Field(default="BR")
    lang: str = Field(default="pt-BR")
    top_n: int = Field(default=10, ge=1, le=50)


class SerpExtraPayload(BaseModel):
    """Campos extras do payload Apify (PAA, relacionadas, snippet)."""

    people_also_ask: list[dict[str, Any]] = Field(default_factory=list)
    related_searches: list[dict[str, Any]] = Field(default_factory=list)
    featured_snippet: dict[str, Any] | None = None


class SerpCollectResult(BaseModel):
    """Resultado parseado de uma execucao do Google Search Scraper.

    ``raw_dataset_items`` guarda itens crus do dataset Apify (lista de dicts)
    para auditoria em arquivo local; ``raw_jsonb`` no Supabase pode ser um
    recorte por linha (ver collector).
    """

    keyword: str
    organic: list[SerpOrganicItem]
    extras: SerpExtraPayload
    raw_dataset_items: list[dict[str, Any]] = Field(default_factory=list)
    estimated_cost_brl: float = 0.0


class SerpSnapshotReport(BaseModel):
    """Resumo apos persistir (ou dry-run) snapshot para um termo."""

    termo_id: UUID
    keyword: str
    rows_inserted: int
    skipped_cache: bool
    estimated_cost_brl: float
    top_domains: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    raw_path: str | None = None
