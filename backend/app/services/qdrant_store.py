from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

from app.config import get_settings


@lru_cache
def get_qdrant() -> QdrantClient:
    settings = get_settings()
    if settings.qdrant_url:
        return QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
            timeout=60,
        )

    path = Path(settings.qdrant_local_path)
    path.mkdir(parents=True, exist_ok=True)
    return QdrantClient(path=str(path))


def ensure_collection(vector_size: int) -> None:
    settings = get_settings()
    client = get_qdrant()
    name = settings.qdrant_collection

    exists = client.collection_exists(name)
    if exists:
        info = client.get_collection(name)
        current = info.config.params.vectors.size  # type: ignore[union-attr]
        if current == vector_size:
            return
        client.delete_collection(name)

    client.create_collection(
        collection_name=name,
        vectors_config=qm.VectorParams(size=vector_size, distance=qm.Distance.COSINE),
    )


def collection_point_count() -> int | None:
    settings = get_settings()
    client = get_qdrant()
    name = settings.qdrant_collection
    if not client.collection_exists(name):
        return None
    info = client.get_collection(name)
    return int(info.points_count or 0)


def search(vector: list[float], limit: int = 3) -> list[qm.ScoredPoint]:
    settings = get_settings()
    client = get_qdrant()
    response = client.query_points(
        collection_name=settings.qdrant_collection,
        query=vector,
        limit=limit,
        with_payload=True,
    )
    return list(response.points)
