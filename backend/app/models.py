from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    AUTHENTIC = "authentic"
    ALTERED = "altered"
    FABRICATED = "fabricated"


class VerifyRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=8000)


class MatchResult(BaseModel):
    arabic_text: str = ""
    english_text: str = ""
    source: str = ""
    collection: str = ""
    reference: str = ""
    grading: str = ""
    similarity: float = 0.0


class VerifyResponse(BaseModel):
    verdict: Verdict
    similarity: float
    query: str
    match: MatchResult | None = None
    summary: str = ""
    color: str = ""


class HealthResponse(BaseModel):
    status: str
    qdrant: str
    collection: str
    points: int | None = None
    embedding_model: str
    details: dict[str, Any] | None = None
