"""
Seed Qdrant with authentic Islamic texts.

Primary source: Hugging Face ArabicNLPWorld/canonical-islamic-corpus
Fallback: curated sample passages (Quran + Hadith) if the dataset is unavailable.
"""

from __future__ import annotations

import hashlib
import sys
import uuid
from pathlib import Path
from typing import Any, Iterable

# Allow running as `python -m scripts.seed_corpus` from backend/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qdrant_client.http import models as qm

from app.config import get_settings
from app.services.embeddings import embed_passages, get_embedder
from app.services import qdrant_store


SAMPLE_CORPUS: list[dict[str, Any]] = [
    {
        "arabic_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "english_text": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
        "source": "Quran",
        "collection": "quran",
        "reference": "1:1",
        "grading": "Sahih",
    },
    {
        "arabic_text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        "english_text": "All praise is due to Allah, Lord of the worlds.",
        "source": "Quran",
        "collection": "quran",
        "reference": "1:2",
        "grading": "Sahih",
    },
    {
        "arabic_text": "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
        "english_text": "Actions are but by intentions.",
        "source": "Sahih Bukhari",
        "collection": "hadith",
        "reference": "Bukhari 1",
        "grading": "Sahih",
    },
    {
        "arabic_text": "مَنْ حَسَّنَ إِسْلَامَ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ",
        "english_text": "Part of the perfection of one's Islam is his leaving that which does not concern him.",
        "source": "Sunan al-Tirmidhi",
        "collection": "hadith",
        "reference": "Tirmidhi 2318",
        "grading": "Hasan",
    },
    {
        "arabic_text": "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        "english_text": "None of you truly believes until he loves for his brother what he loves for himself.",
        "source": "Sahih Bukhari",
        "collection": "hadith",
        "reference": "Bukhari 13",
        "grading": "Sahih",
    },
    {
        "arabic_text": "الدِّينُ النَّصِيحَةُ",
        "english_text": "The religion is sincere advice.",
        "source": "Sahih Muslim",
        "collection": "hadith",
        "reference": "Muslim 55",
        "grading": "Sahih",
    },
    {
        "arabic_text": "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
        "english_text": "Whoever believes in Allah and the Last Day should speak good or remain silent.",
        "source": "Sahih Bukhari",
        "collection": "hadith",
        "reference": "Bukhari 6018",
        "grading": "Sahih",
    },
    {
        "arabic_text": "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ",
        "english_text": "And We have not sent you, [O Muhammad], except as a mercy to the worlds.",
        "source": "Quran",
        "collection": "quran",
        "reference": "21:107",
        "grading": "Sahih",
    },
]


def _point_id(stable_key: str) -> str:
    digest = hashlib.sha1(stable_key.encode("utf-8")).hexdigest()
    return str(uuid.UUID(digest[:32]))


def _normalize_hf_row(row: dict[str, Any]) -> dict[str, Any] | None:
    arabic = (
        row.get("arabic_text")
        or row.get("arabic")
        or row.get("text_ar")
        or row.get("ar")
        or ""
    )
    english = (
        row.get("english_text")
        or row.get("english")
        or row.get("text_en")
        or row.get("translation")
        or row.get("en")
        or ""
    )
    text = row.get("text") or row.get("content") or row.get("passage") or ""

    arabic = str(arabic).strip()
    english = str(english).strip()
    text = str(text).strip()

    if not arabic and not english and not text:
        return None
    if not arabic and not english:
        english = text

    source = str(row.get("source") or row.get("book") or row.get("collection_name") or "Islamic Corpus").strip()
    collection = str(row.get("collection") or row.get("corpus") or row.get("type") or "corpus").strip()
    reference = str(row.get("reference") or row.get("ref") or row.get("id") or "").strip()
    grading = str(row.get("grading") or row.get("grade") or row.get("authenticity") or "").strip()

    return {
        "arabic_text": arabic,
        "english_text": english,
        "source": source,
        "collection": collection,
        "reference": reference,
        "grading": grading or "Unspecified",
    }


def load_hf_corpus(limit: int | None = None) -> list[dict[str, Any]]:
    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise RuntimeError("Install datasets package to load Hugging Face corpus") from exc

    ds = load_dataset("ArabicNLPWorld/canonical-islamic-corpus", split="train")
    rows: list[dict[str, Any]] = []
    for i, row in enumerate(ds):
        normalized = _normalize_hf_row(dict(row))
        if normalized:
            rows.append(normalized)
        if limit is not None and len(rows) >= limit:
            break
    return rows


def load_corpus(prefer_hf: bool = True, hf_limit: int | None = 5000) -> list[dict[str, Any]]:
    if prefer_hf:
        try:
            print("Loading Hugging Face dataset ArabicNLPWorld/canonical-islamic-corpus ...")
            rows = load_hf_corpus(limit=hf_limit)
            if rows:
                print(f"Loaded {len(rows)} rows from Hugging Face.")
                return rows
        except Exception as exc:
            print(f"HF dataset unavailable ({exc}). Falling back to sample corpus.")
    print(f"Using sample corpus ({len(SAMPLE_CORPUS)} passages).")
    return SAMPLE_CORPUS


def passage_text(item: dict[str, Any]) -> str:
    parts = [item.get("arabic_text") or "", item.get("english_text") or ""]
    return "\n".join(p for p in parts if p).strip()


def upsert_corpus(items: Iterable[dict[str, Any]], batch_size: int = 64) -> int:
    settings = get_settings()
    client = qdrant_store.get_qdrant()
    model = get_embedder()
    dim = int(
        model.get_embedding_dimension()
        if hasattr(model, "get_embedding_dimension")
        else model.get_sentence_embedding_dimension()
    )
    qdrant_store.ensure_collection(dim)

    buffer: list[dict[str, Any]] = []
    total = 0

    def flush() -> None:
        nonlocal total
        if not buffer:
            return
        texts = [passage_text(x) for x in buffer]
        vectors = embed_passages(texts, batch_size=min(32, len(texts)))
        points = []
        for item, vector in zip(buffer, vectors):
            key = f"{item.get('source')}|{item.get('reference')}|{passage_text(item)[:200]}"
            points.append(
                qm.PointStruct(
                    id=_point_id(key),
                    vector=vector,
                    payload=item,
                )
            )
        client.upsert(collection_name=settings.qdrant_collection, points=points)
        total += len(points)
        print(f"Upserted {total} points...")
        buffer.clear()

    for item in items:
        if not passage_text(item):
            continue
        buffer.append(item)
        if len(buffer) >= batch_size:
            flush()
    flush()
    return total


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Seed VeritasAI Qdrant corpus")
    parser.add_argument("--sample-only", action="store_true", help="Skip Hugging Face; use sample data")
    parser.add_argument("--limit", type=int, default=5000, help="Max HF rows to index")
    args = parser.parse_args()

    items = load_corpus(prefer_hf=not args.sample_only, hf_limit=args.limit)
    count = upsert_corpus(items)
    print(f"Done. Indexed {count} passages into '{get_settings().qdrant_collection}'.")


if __name__ == "__main__":
    main()
