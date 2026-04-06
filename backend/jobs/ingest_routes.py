"""Scheduled supply route ingestion job."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.config import get_settings
from backend.services.route_service import get_all_routes


def run() -> dict:
    settings = get_settings()
    processed_dir = Path(settings.processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)

    routes = get_all_routes()
    output_path = processed_dir / "routes_processed.json"
    output_path.write_text(json.dumps({"routes": routes}, indent=2), encoding="utf-8")
    return {"status": "ok", "output_file": str(output_path), "records_processed": len(routes)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
