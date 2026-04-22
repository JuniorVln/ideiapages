"""Tipos Pydantic para Google Trends (pytrends)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TrendDataPoint(BaseModel):
    """Um ponto da série (agregado mensal YYYY-MM)."""

    data: str = Field(..., description="Mês ISO, ex.: 2025-04")
    interesse: int = Field(..., ge=0, le=100)


class RelatedQuery(BaseModel):
    """Query relacionada (rising ou top)."""

    query: str
    value: str = Field(default="", description="Valor exibido pelo Trends (número ou 'Breakout')")


class TrendsCollectInput(BaseModel):
    """Parâmetros de uma coleta Trends."""

    keyword: str = Field(..., min_length=2, max_length=200)
    geo: str = Field(default="BR", min_length=2, max_length=8)
    timeframe: str = Field(default="today 12-m")
    cat: int = Field(default=0, ge=0)


class TrendsCollectResult(BaseModel):
    """Resposta bruta normalizada do pytrends (antes da análise de slope)."""

    keyword: str
    geo: str
    timeframe: str
    serie: list[TrendDataPoint] = Field(default_factory=list)
    rising_queries: list[RelatedQuery] = Field(default_factory=list)
    top_queries: list[RelatedQuery] = Field(default_factory=list)
