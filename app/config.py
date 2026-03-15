"""
Application configuration via environment variables.
Uses pydantic-settings for validation and .env file support.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database - set DATABASE_URL in env
    database_url: str = Field(
        default="sqlite:///./dev.db",
        validation_alias="DATABASE_URL",
    )

    # CORS - comma-separated list, set CORS_ORIGINS in env
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000",
        validation_alias="CORS_ORIGINS",
    )

    # JWT
    secret_key: str = Field(
        default="change-me-in-production-use-openssl-rand-hex-32",
        validation_alias="SECRET_KEY",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Set AUTH_DISABLED=true for local dev (bypasses JWT on protected endpoints)
    auth_disabled: bool = Field(
        default=True,
        validation_alias="AUTH_DISABLED",
    )  # Default True for backward compat during dev

    # Sentry DSN - when set, error tracking is enabled
    sentry_dsn: str | None = Field(default=None, validation_alias="SENTRY_DSN")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
