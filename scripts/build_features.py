"""Prepare model-ready features for each region."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.core.feature_engineering import build_region_features
from backend.services import data_store


def _load_json(path: Path) -> List[Dict]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _as_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _normalize_routes(rows: List[Dict]) -> List[Dict]:
    normalized = []
    for row in rows:
        normalized.append(
            {
                "id": int(row.get("id", 0)),
                "from_region_id": int(row.get("from_region_id", 0)),
                "to_region_id": int(row.get("to_region_id", 0)),
                "route_type": str(row.get("route_type", "road")),
                "distance_km": _as_float(row.get("distance_km")),
                "travel_time_hr": _as_float(row.get("travel_time_hr")),
                "route_status": str(row.get("route_status", "open")),
                "disruption_risk": _as_float(row.get("disruption_risk")),
            }
        )
    return normalized


def run() -> dict:
    processed_dir = Path("data/processed")
    processed_dir.mkdir(parents=True, exist_ok=True)

    climate_rows = _load_json(processed_dir / "climate_clean.json")
    route_rows = _normalize_routes(_load_json(processed_dir / "routes_clean.json"))

    output_rows = []
    for region in data_store.get_regions():
        region_id = region["id"]
        region_climate = [item for item in climate_rows if item.get("region_id") == region_id]
        if not region_climate:
            region_climate = data_store.get_climate_events_by_region(region_id)

        region_routes = [
            route
            for route in route_rows
            if route.get("from_region_id") == region_id or route.get("to_region_id") == region_id
        ]
        if not region_routes:
            region_routes = data_store.get_routes_for_region(region_id)

        crop_patterns = data_store.get_crop_patterns_by_region(region_id)
        external_signals = data_store.get_external_signals_for_region(region_id)
        features = build_region_features(
            climate_events=region_climate,
            crop_patterns=crop_patterns,
            region_routes=region_routes,
            region_priority=region.get("priority_level", 1),
            external_signals=external_signals,
        )
        output_rows.append({"region_id": region_id, "features": features})

    output_path = processed_dir / "features.json"
    output_path.write_text(json.dumps(output_rows, indent=2), encoding="utf-8")
    return {"status": "ok", "output": str(output_path), "records_processed": len(output_rows)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
