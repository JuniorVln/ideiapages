"""Tipos Pydantic para coleta de autocomplete e People Also Ask."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AutocompleteSuggestion(BaseModel):
    """Uma sugestão retornada pelo actor de autocomplete."""

    text: str = Field(..., description="Texto da sugestão (keyword)")
    position: int | None = Field(default=None, description="Posição quando disponível")
    relevance_score: float | None = Field(default=None, description="Score do actor, se houver")
    seed: str | None = Field(default=None, description="Seed que gerou a sugestão")


class PAAQuestion(BaseModel):
    """Pergunta da seção People Also Ask."""

    question: str
    answer: str | None = None
    url: str | None = None


class AutocompleteCollectInput(BaseModel):
    """Entrada lógica para uma rodada de coleta (autocomplete + PAA)."""

    seed: str = Field(..., min_length=2, max_length=200)
    geo: str = Field(default="BR", min_length=2, max_length=8)
    lang: str = Field(default="pt-BR", min_length=2, max_length=12)
    limit: int = Field(default=50, ge=1, le=500)


class AutocompleteCollectResult(BaseModel):
    """Resultado agregado bruto (antes de normalizar/deduplicar)."""

    autocomplete: list[AutocompleteSuggestion] = Field(default_factory=list)
    paa: list[PAAQuestion] = Field(default_factory=list)
    estimated_cost_brl: float = Field(default=0.0, ge=0)
