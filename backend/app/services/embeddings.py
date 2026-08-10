from __future__ import annotations

from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import get_settings


@lru_cache
def get_embedder() -> SentenceTransformer:
    settings = get_settings()
    return SentenceTransformer(settings.embedding_model)


def embed_query(text: str) -> list[float]:
    """E5 models expect 'query: ' prefix for search queries."""
    model = get_embedder()
    vector = model.encode(f"query: {text}", normalize_embeddings=True)
    return vector.tolist()


def embed_passage(text: str) -> list[float]:
    """E5 models expect 'passage: ' prefix for indexed documents."""
    model = get_embedder()
    vector = model.encode(f"passage: {text}", normalize_embeddings=True)
    return vector.tolist()


def embed_passages(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    model = get_embedder()
    prefixed = [f"passage: {t}" for t in texts]
    vectors = model.encode(prefixed, normalize_embeddings=True, batch_size=batch_size, show_progress_bar=True)
    return [v.tolist() for v in vectors]
