"""Tipos para raspagem de conteudo concorrente (Firecrawl)."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class ExtractedStructure(BaseModel):
    """Metadados derivados do markdown."""

    headings_h2: list[str] = Field(default_factory=list)
    headings_h3: list[str] = Field(default_factory=list)
    word_count: int = 0
    tem_faq: bool = False
    tem_tabela: bool = False
    tem_imagem: bool = False
    idioma_detectado: str | None = None
    thin: bool = False


class ScrapedPage(BaseModel):
    """Resposta normalizada do Firecrawl para uma URL."""

    url: str
    markdown: str
    html: str | None = None
    paywalled: bool = False
    truncated: bool = False
    warning: str | None = None
    detected_language: str | None = None
    estimated_cost_brl: float = 0.0


class ScrapeInput(BaseModel):
    """Parametros de uma raspagem unitaria."""

    url: str
    timeout_ms: int = Field(default=60_000, ge=5_000, le=120_000)


class ScrapeResult(BaseModel):
    """Resultado + extracao para persistencia."""

    snapshot_row_id: UUID
    url: str
    ok: bool
    error: str | None = None
    page: ScrapedPage | None = None


class ScrapeBatchReport(BaseModel):
    """Resumo de um lote (um grupo SERP)."""

    termo_id: UUID
    capturado_em: str
    urls_total: int
    scraped_ok: int
    scraped_fail: int
    cache_hits: int
    thin: int
    paywalled: int
    truncated: int
    cost_brl: float
    errors: list[str] = Field(default_factory=list)
