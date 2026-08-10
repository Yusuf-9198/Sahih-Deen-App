from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    qdrant_url: str = ""
    qdrant_api_key: str = ""
    qdrant_collection: str = "islamic_corpus"
    qdrant_local_path: str = "./data/qdrant"

    embedding_model: str = "intfloat/multilingual-e5-large"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    cors_origins: str = "*"

    # Cosine similarity thresholds (higher = more similar).
    # multilingual-e5 often scores unrelated short text ~0.75–0.82, so the
    # altered band starts higher than a naive 0.75 cutoff.
    threshold_authentic: float = 0.90
    threshold_altered: float = 0.85


@lru_cache
def get_settings() -> Settings:
    return Settings()
