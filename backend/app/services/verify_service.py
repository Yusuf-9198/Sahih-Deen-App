from __future__ import annotations

from app.models import MatchResult, VerifyResponse
from app.services.embeddings import embed_query
from app.services.hadith_api import enrich_hadith
from app.services import qdrant_store
from app.services.verifier import grade_similarity, summarize_difference


def _payload_str(payload: dict, *keys: str) -> str:
    for key in keys:
        value = payload.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def verify_quote(query: str) -> VerifyResponse:
    cleaned = " ".join(query.split()).strip()
    vector = embed_query(cleaned)
    hits = qdrant_store.search(vector, limit=3)

    if not hits:
        verdict, color = grade_similarity(0.0)
        return VerifyResponse(
            verdict=verdict,
            similarity=0.0,
            query=cleaned,
            match=None,
            summary=summarize_difference(verdict, cleaned, None),
            color=color,
        )

    top = hits[0]
    score = float(top.score or 0.0)
    payload = top.payload or {}

    match = MatchResult(
        arabic_text=_payload_str(payload, "arabic_text", "arabic", "text_ar"),
        english_text=_payload_str(payload, "english_text", "english", "text_en", "translation"),
        source=_payload_str(payload, "source", "book", "collection_name"),
        collection=_payload_str(payload, "collection", "corpus", "type"),
        reference=_payload_str(payload, "reference", "ref", "hadith_number", "ayah"),
        grading=_payload_str(payload, "grading", "grade", "authenticity"),
        similarity=round(score, 4),
    )

    if not match.arabic_text and not match.english_text:
        match.english_text = _payload_str(payload, "text", "content", "passage")

    if match.source and (not match.grading or not match.english_text):
        extra = enrich_hadith(match.source, match.reference)
        if extra.get("english_text") and not match.english_text:
            match.english_text = extra["english_text"]
        if extra.get("grading") and not match.grading:
            match.grading = extra["grading"]

    verdict, color = grade_similarity(score)
    summary = summarize_difference(verdict, cleaned, match)

    return VerifyResponse(
        verdict=verdict,
        similarity=round(score, 4),
        query=cleaned,
        match=match,
        summary=summary,
        color=color,
    )
