# VeritasAI

Islamic quote & text fact-checker. Scan or paste a quote; the mobile app OCR-extracts text on-device, then a FastAPI backend runs RAG vector search over a verified Quran/Hadith corpus in Qdrant.

## Architecture

```
Mobile (Expo)  --OCR-->  POST /verify { query }  -->  FastAPI
                                                      | embed (multilingual-e5-large)
                                                      | search Qdrant (cosine)
                                                      | grade similarity
                                                      | optional OpenAI summary
                                                      v
                                                   Result JSON
```

### Similarity grading (cosine similarity, not distance)

| Score | Verdict |
|------:|---------|
| ≥ 0.90 | Authentic / Sahih |
| 0.85–0.89 | Altered / Misquoted |
| < 0.85 | Fabricated / No Match |

> Spec originally used 0.75 for the lower band. With `multilingual-e5-large`, unrelated short text often still scores ~0.75–0.82, so the altered floor defaults to **0.85**.

## Repo layout

- `mobile/` — Expo SDK 57, Expo Router, NativeWind, Vision Camera + ML Kit OCR
- `backend/` — FastAPI, sentence-transformers, Qdrant client, seed + smoke scripts
- `docker-compose.yml` — Qdrant service

## Prerequisites

- Node 20+
- Python 3.11–3.12 recommended (3.14 works here with current wheels)
- Docker Desktop optional (without it, backend uses on-disk Qdrant at `backend/data/qdrant`)
- Android Studio / Xcode for a **development build** (Vision Camera + ML Kit do **not** run in Expo Go)

## Quick start (Windows)

```bash
# 1) Backend (once)
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m scripts.seed_corpus --sample-only
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2) Mobile (new terminal)
cd mobile
copy .env.example .env
npm install
npx expo start
```

From repo root you can also use:

```bash
npm run api
npm run mobile
npm run smoke    # API must be running
```

## Backend

### Qdrant

```bash
docker compose up -d
```

Set `QDRANT_URL=http://localhost:6333` in `backend/.env`. Leave it empty to use local embedded storage.

### Seed corpus

```bash
cd backend
.\.venv\Scripts\activate
python -m scripts.seed_corpus --sample-only          # offline sample
python -m scripts.seed_corpus --limit 5000           # Hugging Face corpus
```

First embedding run downloads `intfloat/multilingual-e5-large` (~2GB).

### API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://127.0.0.1:8000/health
- Docs: http://127.0.0.1:8000/docs
- Verify: `POST /verify` `{ "query": "Actions are but by intentions." }`
- Smoke: `python -m scripts.smoke_test`

Optional: `OPENAI_API_KEY` for LLM difference summaries. Without it, a local deterministic summary is used.

## Mobile

```bash
cd mobile
copy .env.example .env
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to your LAN IP on a physical device (e.g. `http://192.168.1.10:8000`).

### OCR development build

```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

Paste-text verification works without native OCR. Camera / gallery OCR needs the Dev Client build.

### Theme

- Background `#0f172a`, surfaces `#1e293b`, primary `#10b981`
- Status: verified `#22c55e`, altered `#eab308`, fabricated `#ef4444`
- Fonts: Inter (UI), Amiri (Arabic)

## Notes

- ML Kit Text Recognition scripts are Latin / CJK / Devanagari — **Arabic OCR is limited**. Prefer **Paste Text** for Arabic.
- Hadith enrichment uses the [Fawaz Ahmed Hadith API](https://github.com/fawazahmed0/hadith-api) when grading/text is missing.
- The LLM only formats differences from retrieved matches — it does not invent sources.
- Web preview supports paste-verify; camera OCR is native-only (`scan.native.tsx`).

## Status & Authentication

- **Status:** This project is functional for paste-based verification and includes a small sample corpus, but some features are not fully complete (native Arabic OCR, large HF corpus indexing, and mobile OCR dev builds require additional setup).

- **Required authentication / tokens:**
   - **`OPENAI_API_KEY`**: (optional) Place in `backend/.env` to enable OpenAI summaries. Without it, a deterministic local summary is used.
   - **`HF_TOKEN`**: (recommended) Set a Hugging Face token to avoid rate limits when downloading the full corpus. Export as an environment variable before running `scripts.seed_corpus` or set in `backend/.env`.
   - **`QDRANT_URL` / `QDRANT_API_KEY`**: If using a remote Qdrant instance, set these in `backend/.env`. Leave empty to use local on-disk Qdrant at `backend/data/qdrant`.
   - **Mobile:** set `EXPO_PUBLIC_API_URL` in `mobile/.env` to point to your backend (e.g. `http://192.168.1.10:8000`) when testing on a physical device.

- **Quick `.env` setup (backend):**

```powershell
cd backend
copy .env.example .env
# Edit backend/.env and set OPENAI_API_KEY, HF_TOKEN, QDRANT_URL as needed
```

- **Notes on completeness:**
   - Arabic OCR quality for production is limited; prefer paste-text for Arabic verification.
   - The sample corpus is sufficient for smoke tests; run `python -m scripts.seed_corpus --limit N` with `HF_TOKEN` to index a larger dataset.
   - If you want, I can add an explicit authentication guide or `.env.example` comments — tell me which tokens you'd like documented.
"# Sahih-Deen-App" 
# Sahih-Deen-App
