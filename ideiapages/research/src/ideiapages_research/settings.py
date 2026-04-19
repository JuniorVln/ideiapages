"""Configuração central via variáveis de ambiente.

Lê o .env da raiz de ideiapages/ (dois níveis acima do código).
"""

from __future__ import annotations

from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT.parent / ".env"


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


_settings: Settings | None = None


def get_settings() -> Settings:
    """Singleton para evitar reler .env toda hora."""
    global _settings
    if _settings is None:
        _settings = Settings()  # type: ignore[call-arg]
    return _settings
