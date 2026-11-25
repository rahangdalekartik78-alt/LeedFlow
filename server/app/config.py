"""Application settings loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    DATABASE_URL: str = "sqlite:///./leadflow.db"
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CLIENT_URL: str = "http://localhost:5173"
    ENV: str = "development"

    @property
    def db_url(self) -> str:
        return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)


settings = Settings()
if not settings.SECRET_KEY:
    if settings.ENV == "production":
        raise RuntimeError("SECRET_KEY must be set in production")
    settings.SECRET_KEY = "dev-only-insecure-key-change-me-0123456789"
