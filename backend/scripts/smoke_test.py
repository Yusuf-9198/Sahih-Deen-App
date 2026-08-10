"""Quick smoke test for a running VeritasAI API."""

from __future__ import annotations

import sys

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def main() -> int:
    with httpx.Client(timeout=120.0) as client:
        health = client.get(f"{BASE}/health")
        health.raise_for_status()
        body = health.json()
        print("health:", body)
        if not body.get("points"):
            print("FAIL: corpus empty — run python -m scripts.seed_corpus --sample-only")
            return 1

        authentic = client.post(
            f"{BASE}/verify",
            json={"query": "Actions are but by intentions."},
        )
        authentic.raise_for_status()
        a = authentic.json()
        print("authentic sample:", a["verdict"], a["similarity"])

        fake = client.post(
            f"{BASE}/verify",
            json={"query": "Buy crypto now and become rich overnight with this secret"},
        )
        fake.raise_for_status()
        f = fake.json()
        print("unrelated sample:", f["verdict"], f["similarity"])

        if a["verdict"] != "authentic":
            print("FAIL: expected authentic for known Hadith")
            return 1
        print("OK")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
