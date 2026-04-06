"""Climate ingestion and normalization services."""

from __future__ import annotations

from statistics import mean
from typing import Dict, List

from backend.services import data_store


def get_region_climate_history(region_id: int) -> List[Dict]:
    return data_store.get_climate_events_by_region(region_id)


def get_region_climate_summary(region_id: int) -> Dict:
    history = get_region_climate_history(region_id)
    if not history:
        return {
            "region_id": region_id,
            "latest_date": None,
            "avg_rainfall": 0.0,
            "avg_temperature": 0.0,
            "avg_drought_index": 0.0,
            "avg_flood_probability": 0.0,
            "avg_temperature_anomaly": 0.0,
            "latest_signals": {},
        }

    latest = history[-1]
    return {
        "region_id": region_id,
        "latest_date": latest["date"],
        "avg_rainfall": float(mean(item["rainfall"] for item in history)),
        "avg_temperature": float(mean(item["temperature"] for item in history)),
        "avg_drought_index": float(mean(item["drought_index"] for item in history)),
        "avg_flood_probability": float(mean(item["flood_probability"] for item in history)),
        "avg_temperature_anomaly": float(mean(item["temperature_anomaly"] for item in history)),
        "latest_signals": latest,
    }


def ingest_and_normalize_climate_data() -> Dict:
    events = data_store.get_climate_events()
    regions = {event["region_id"] for event in events}
    return {
        "status": "completed",
        "records_processed": len(events),
        "regions_covered": len(regions),
    }

