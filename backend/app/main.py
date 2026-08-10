from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import HealthResponse, VerifyRequest, VerifyResponse
from app.services.embeddings import get_embedder
from app.services import qdrant_store
from app.services.verify_service import verify_quote


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Warm embedding model on startup so first /verify is faster
    get_embedder()
    yield


app = FastAPI(
    title="VeritasAI API",
    description="Islamic quote & text fact-checker using RAG over a verified corpus.",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    qdrant_status = "ok"
    points = None
    try:
        points = qdrant_store.collection_point_count()
        if points is None:
            qdrant_status = "collection_missing"
    except Exception as exc:
        qdrant_status = f"error: {exc}"

    return HealthResponse(
        status="ok" if qdrant_status == "ok" else "degraded",
        qdrant=qdrant_status,
        collection=settings.qdrant_collection,
        points=points,
        embedding_model=settings.embedding_model,
    )


@app.post("/verify", response_model=VerifyResponse)
def verify(body: VerifyRequest) -> VerifyResponse:
    try:
        count = qdrant_store.collection_point_count()
        if not count:
            raise HTTPException(
                status_code=503,
                detail="Corpus not indexed. Run: python -m scripts.seed_corpus",
            )
        return verify_quote(body.query)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/")
def root():
    return {"name": "VeritasAI", "docs": "/docs", "health": "/health", "verify": "POST /verify"}
