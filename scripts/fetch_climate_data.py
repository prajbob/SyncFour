"""Fetch climate observations from NOAA and write climate seed/sample data."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.services import data_store
from backend.services.noaa_service import build_climate_events_from_hourly


def _seed_fallback_rows() -> list[dict]:
    sample_path = Path("data/sample/sample_climate.json")
    if not sample_path.exists():
        return []
    return json.loads(sample_path.read_text(encoding="utf-8"))


def run() -> dict:
    regions = data_store.get_regions()
    generated_rows: list[dict] = []

    for region in regions:
        region_id = int(region["id"])
        lat = float(region["latitude"])
        lon = float(region["longitude"])
        events = build_climate_events_from_hourly(region_id, lat, lon, max_periods=8)
        generated_rows.extend(events)

    if not generated_rows:
        generated_rows = _seed_fallback_rows()
        source = "fallback_seed_data"
    else:
        source = "noaa_weather_gov_hourly"

    # Ensure deterministic IDs across all rows
    generated_rows.sort(key=lambda item: (int(item.get("region_id", 0)), str(item.get("date", ""))))
    for idx, row in enumerate(generated_rows, start=1):
        row["id"] = idx

    sample_target = Path("data/sample/sample_climate.json")
    raw_target = Path("data/raw/climate/climate_data.json")
    sample_target.parent.mkdir(parents=True, exist_ok=True)
    raw_target.parent.mkdir(parents=True, exist_ok=True)

    payload = json.dumps(generated_rows, indent=2)
    sample_target.write_text(payload, encoding="utf-8")
    raw_target.write_text(payload, encoding="utf-8")

    return {
        "status": "ok",
        "source": source,
        "sample_output": str(sample_target),
        "raw_output": str(raw_target),
        "records": len(generated_rows),
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

