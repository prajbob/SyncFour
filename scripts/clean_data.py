"""Normalize values, units, and missing fields in raw datasets."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List


def _clean_climate(rows: List[Dict]) -> List[Dict]:
    cleaned = []
    for row in rows:
        cleaned.append(
            {
                "id": int(row.get("id", 0)),
                "region_id": int(row.get("region_id", 0)),
                "date": str(row.get("date", "")),
                "rainfall": round(float(row.get("rainfall", 0.0)), 3),
                "temperature": round(float(row.get("temperature", 0.0)), 3),
                "drought_index": round(min(1.0, max(0.0, float(row.get("drought_index", 0.0)))), 4),
                "flood_probability": round(min(1.0, max(0.0, float(row.get("flood_probability", 0.0)))), 4),
                "temperature_anomaly": round(float(row.get("temperature_anomaly", 0.0)), 3),
                "rainfall_anomaly": round(float(row.get("rainfall_anomaly", 0.0)), 3),
            }
        )
    return cleaned


def _clean_csv(path: Path) -> List[Dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def run() -> dict:
    climate_raw_path = Path("data/raw/climate/climate_data.json")
    crops_raw_path = Path("data/raw/crops/crops_data.csv")
    routes_raw_path = Path("data/raw/routes/routes_data.csv")
    processed_dir = Path("data/processed")
    processed_dir.mkdir(parents=True, exist_ok=True)

    climate_rows = json.loads(climate_raw_path.read_text(encoding="utf-8")) if climate_raw_path.exists() else []
    cleaned_climate = _clean_climate(climate_rows)
    cleaned_crops = _clean_csv(crops_raw_path)
    cleaned_routes = _clean_csv(routes_raw_path)

    (processed_dir / "climate_clean.json").write_text(json.dumps(cleaned_climate, indent=2), encoding="utf-8")
    (processed_dir / "crops_clean.json").write_text(json.dumps(cleaned_crops, indent=2), encoding="utf-8")
    (processed_dir / "routes_clean.json").write_text(json.dumps(cleaned_routes, indent=2), encoding="utf-8")

    return {
        "status": "ok",
        "climate_records": len(cleaned_climate),
        "crop_records": len(cleaned_crops),
        "route_records": len(cleaned_routes),
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

