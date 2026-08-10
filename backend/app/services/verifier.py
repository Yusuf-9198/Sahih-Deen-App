from __future__ import annotations

from openai import OpenAI

from app.config import get_settings
from app.models import MatchResult, Verdict


SYSTEM_PROMPT = """You are VeritasAI, an Islamic text verification assistant.
You ONLY summarize differences between a user-submitted quote and a retrieved authentic match.
Rules:
- Never invent Quranic verses, Hadiths, sources, or grades.
- Use only the provided match fields.
- If verdict is fabricated / no match, say clearly that no authentic match was found.
- Be concise (2-4 sentences). Neutral scholarly tone.
- Do not issue religious rulings beyond reporting the retrieval result.
"""


def grade_similarity(score: float) -> tuple[Verdict, str]:
    settings = get_settings()
    if score >= settings.threshold_authentic:
        return Verdict.AUTHENTIC, "#22c55e"
    if score >= settings.threshold_altered:
        return Verdict.ALTERED, "#eab308"
    return Verdict.FABRICATED, "#ef4444"


def build_fallback_summary(verdict: Verdict, query: str, match: MatchResult | None) -> str:
    if verdict == Verdict.AUTHENTIC and match:
        return (
            f"Strong match ({match.similarity:.0%}) with {match.source or 'the corpus'}. "
            f"The submitted text closely aligns with the authentic reference"
            + (f" ({match.reference})." if match.reference else ".")
        )
    if verdict == Verdict.ALTERED and match:
        return (
            f"Partial match ({match.similarity:.0%}) with {match.source or 'the corpus'}. "
            "Wording may be altered, paraphrased, or incomplete compared to the authentic text."
        )
    return (
        "No sufficiently close match was found in the verified corpus. "
        "Treat the quote as unverified until checked against primary sources."
    )


def summarize_difference(verdict: Verdict, query: str, match: MatchResult | None) -> str:
    settings = get_settings()
    fallback = build_fallback_summary(verdict, query, match)

    if not settings.openai_api_key:
        return fallback

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        match_block = "No match."
        if match:
            match_block = (
                f"Arabic: {match.arabic_text}\n"
                f"English: {match.english_text}\n"
                f"Source: {match.source}\n"
                f"Reference: {match.reference}\n"
                f"Grading: {match.grading}\n"
                f"Similarity: {match.similarity:.3f}"
            )

        user_prompt = (
            f"Verdict: {verdict.value}\n\n"
            f"User quote:\n{query}\n\n"
            f"Best corpus match:\n{match_block}\n\n"
            "Summarize the verification result for the user."
        )

        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            max_tokens=220,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = (response.choices[0].message.content or "").strip()
        return content or fallback
    except Exception:
        return fallback
