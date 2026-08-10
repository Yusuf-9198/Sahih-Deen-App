"""
Optional enrichment via Fawaz Ahmed Hadith API (cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1).

Used when a corpus match lacks grading/reference details and looks like a known collection.
Network failures are ignored — verification never depends on this.
"""

from __future__ import annotations

import httpx

# Minimal book slug map for enrichment lookups
BOOK_SLUGS = {
    "bukhari": "bukhari",
    "sahih bukhari": "bukhari",
    "muslim": "muslim",
    "sahih muslim": "muslim",
    "tirmidhi": "tirmidhi",
    "abudawud": "abudawud",
    "abu dawud": "abudawud",
    "nasai": "nasai",
    "ibnmajah": "ibnmajah",
    "ibn majah": "ibnmajah",
}

BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions"


def _slug_for_source(source: str) -> str | None:
    key = source.strip().lower()
    if key in BOOK_SLUGS:
        return BOOK_SLUGS[key]
    for name, slug in BOOK_SLUGS.items():
        if name in key:
            return slug
    return None


def _extract_number(reference: str) -> str | None:
    digits = "".join(ch if ch.isdigit() else " " for ch in reference).split()
    return digits[-1] if digits else None


def enrich_hadith(source: str, reference: str) -> dict[str, str]:
    slug = _slug_for_source(source)
    number = _extract_number(reference)
    if not slug or not number:
        return {}

    url = f"{BASE}/eng-{slug}/{number}.min.json"
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                return {}
            data = resp.json()
            hadiths = data.get("hadiths") or []
            if not hadiths:
                # Some endpoints return a single hadith object
                text = str(data.get("text") or "").strip()
                grade = ""
                grades = data.get("grades") or []
                if grades and isinstance(grades, list):
                    grade = str(grades[0].get("grade") or grades[0])
                return {k: v for k, v in {"english_text": text, "grading": grade}.items() if v}

            item = hadiths[0]
            text = str(item.get("text") or "").strip()
            grade = ""
            grades = item.get("grades") or []
            if grades and isinstance(grades, list):
                first = grades[0]
                grade = str(first.get("grade") if isinstance(first, dict) else first)
            return {k: v for k, v in {"english_text": text, "grading": grade}.items() if v}
    except Exception:
        return {}
