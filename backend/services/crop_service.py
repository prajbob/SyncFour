"""Crop signal processing services."""

from __future__ import annotations

from statistics import mean
from typing import Dict, List

from backend.services import data_store
from backend.services.climate_service import get_region_climate_summary


def get_region_crop_patterns(region_id: int) -> List[Dict]:
    return data_store.get_crop_patterns_by_region(region_id)


def get_crop_catalog() -> List[Dict]:
    return data_store.get_crops()


def get_crop_stress_signals(region_id: int) -> Dict:
    patterns = get_region_crop_patterns(region_id)
    climate = get_region_climate_summary(region_id)
    if not patterns:
        return {
            "region_id": region_id,
            "avg_sensitivity": 0.5,
            "yield_drop_ratio": 0.0,
            "stress_score": 0.0,
        }

    avg_sensitivity = float(mean(pattern["sensitivity_score"] for pattern in patterns))
    avg_yield_drop = float(mean(pattern["yield_drop_ratio"] for pattern in patterns))
    drought = climate["latest_signals"].get("drought_index", 0.0) if climate["latest_signals"] else 0.0
    flood = climate["latest_signals"].get("flood_probability", 0.0) if climate["latest_signals"] else 0.0
    stress_score = min(1.0, 0.4 * avg_sensitivity + 0.35 * avg_yield_drop + 0.25 * max(drought, flood))

    return {
        "region_id": region_id,
        "avg_sensitivity": avg_sensitivity,
        "yield_drop_ratio": avg_yield_drop,
        "stress_score": stress_score,
    }

