"""Scheduled climate ingestion job."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.config import get_settings
from backend.services.climate_service import ingest_and_normalize_climate_data
from backend.services.data_store import get_climate_events


def run() -> dict:
    settings = get_settings()
    processed_dir = Path(settings.processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)

    summary = ingest_and_normalize_climate_data()
    payload = {
        "summary": summary,
        "records": get_climate_events(),
    }
    output_path = processed_dir / "climate_processed.json"
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {"status": "ok", "output_file": str(output_path), **summary}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
