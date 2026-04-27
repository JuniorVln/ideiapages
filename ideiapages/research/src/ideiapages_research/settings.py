"""Configuração central via variáveis de ambiente.

Lê o ``.env`` na raiz do app (``ideiapages/.env``), ao lado de ``.env.example``.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Configurações globais. Todas vêm de env vars."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    supabase_url: str = Field(...)
    supabase_service_role_key: SecretStr = Field(...)

    apify_token: SecretStr = Field(...)
    firecrawl_api_key: SecretStr = Field(...)

    anthropic_api_key: SecretStr = Field(...)
    openai_api_key: SecretStr | None = None
    google_ai_api_key: SecretStr | None = None

    log_level: str = Field(default="INFO")
    dev_mode: bool = Field(default=True)

    #: Conversão aproximada para estimar custo BRL nos resumos de collectors.
    usd_to_brl: float = Field(default=5.5)
    #: Janela (dias) para considerar coleta recente de autocomplete por seed.
    collect_autocomplete_cache_days: int = Field(default=7)

    #: Intervalo mínimo entre chamadas pytrends (anti-ban).
    pytrends_min_interval_s: float = Field(default=2.0)
    #: Cache de tendência em ``termos.tendencia_pytrends`` (dias).
    trend_cache_days: int = Field(default=30)
    #: Limiares de slope (últimos N pontos mensais) para classificar tendência.
    trend_slope_up: float = Field(default=0.5)
    trend_slope_down: float = Field(default=-0.5)
    #: Trends só entrega índice 0–100; este valor é o ``volume_estimado`` quando o índice médio = 100.
    #: Ajuste para calibrar a ordem de grandeza do proxy mensal (não é volume absoluto do Keyword Planner).
    pytrends_volume_proxy_max: int = Field(default=10_000)

    #: Modelo Claude para classify-terms (Haiku).
    classify_model: str = Field(default="claude-haiku-4-5-20251001")
    classify_max_tokens: int = Field(default=16_384)
    classify_temperature: float = Field(default=0.2)
    #: Preços aproximados USD / milhão de tokens (ajuste conforme tabela Anthropic).
    claude_haiku_input_usd_per_mtok: float = Field(default=1.0)
    claude_haiku_output_usd_per_mtok: float = Field(default=5.0)
    #: Não perguntar quando custo acumulado ultrapassa o limiar (CI / operadores).
    skip_cost_confirm: bool = Field(
        default=False,
        validation_alias=AliasChoices("IDEAPAGES_SKIP_COST_CONFIRM", "skip_cost_confirm"),
    )
    #: Limiar BRL para alerta interativo de custo na CLI classify-terms.
    classify_cost_alert_brl: float = Field(default=50.0)

    #: Nao recriar snapshot SERP se ultimo ``capturado_em`` for mais recente que isso.
    serp_cache_days: int = Field(default=30)
    #: Limiar estimado (BRL) para confirmar lote collect-serp (CLI).
    serp_batch_cost_confirm_brl: float = Field(default=10.0)
    #: Dominios extra (virgula), somados ao arquivo ``references/serp_exclusion_domains.txt``.
    serp_exclude_domains_extra: str = Field(default="")

    #: Firecrawl — timeout por URL (milissegundos).
    firecrawl_timeout_ms: int = Field(default=60_000)
    #: Custo aproximado USD por scrape (ajuste ao plano / tabela Firecrawl).
    firecrawl_scrape_usd: float = Field(default=0.003)
    #: Truncar markdown além deste tamanho (protecao DB).
    scrape_max_markdown_chars: int = Field(default=100_000)
    #: Nao re-raspar se ``conteudo_concorrente.raspado_em`` for mais novo que isso.
    scrape_cache_days: int = Field(default=30)
    #: Confirmacao CLI scrape-competitors em lote (BRL estimado).
    scrape_batch_cost_confirm_brl: float = Field(default=20.0)

    #: Analyze-gaps — Claude Sonnet.
    analyze_gaps_model: str = Field(default="claude-sonnet-4-5-20250929")
    analyze_gaps_max_tokens: int = Field(default=8000)
    analyze_gaps_temperature: float = Field(default=0.3)
    claude_sonnet_input_usd_per_mtok: float = Field(default=3.0)
    claude_sonnet_output_usd_per_mtok: float = Field(default=15.0)
    #: Estimativa conservadora por termo (pré-flight CLI).
    analyze_gaps_cost_per_term_estimate_brl: float = Field(default=0.8)
    #: Confirmar lote se N * estimativa > isso (salvo --yes / skip_cost_confirm).
    analyze_gaps_batch_confirm_brl: float = Field(default=20.0)
    analyze_gaps_cache_days: int = Field(default=60)
    #: Referência apenas — analyze-gaps **não aborta** por contagem; usa fallback SERP e stub.
    analyze_gaps_min_competitors: int = Field(default=1)
    analyze_gaps_pause_seconds: float = Field(default=3.0)


_settings: Settings | None = None


def get_settings() -> Settings:
    """Singleton para evitar reler .env toda hora."""
    global _settings
    if _settings is None:
        _settings = Settings()  # type: ignore[call-arg]
    return _settings
