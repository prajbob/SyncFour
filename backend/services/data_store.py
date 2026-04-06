"""Data access helpers for sample/demo datasets and local crop statistics."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from statistics import mean
from typing import Dict, List, Optional

from backend.app.config import get_settings
from backend.services import noaa_service

settings = get_settings()
DATA_ROOT = Path(settings.data_dir)
REPO_ROOT = Path(__file__).resolve().parents[2]
CROP_PRODUCTION_PATH = REPO_ROOT / "crop_production.csv"


def _to_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _to_int(value: object, default: int = 0) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def _normalize_state(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _read_csv(path: Path) -> List[Dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def _read_json(path: Path) -> List[Dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, list):
        return data
    return []


def _latest_region_row(rows: List[Dict], region_id: int) -> Dict:
    filtered = [row for row in rows if _to_int(row.get("region_id")) == region_id]
    if not filtered:
        return {}
    filtered.sort(key=lambda row: str(row.get("date", "")))
    return filtered[-1]


@lru_cache(maxsize=1)
def get_regions() -> List[Dict]:
    rows = _read_csv(DATA_ROOT / "sample_regions.csv")
    return [
        {
            "id": _to_int(row.get("id")),
            "name": row.get("name", ""),
            "country": row.get("country", ""),
            "state": row.get("state", ""),
            "latitude": _to_float(row.get("latitude")),
            "longitude": _to_float(row.get("longitude")),
            "priority_level": _to_int(row.get("priority_level"), 1),
        }
        for row in rows
    ]


def get_region_by_id(region_id: int) -> Optional[Dict]:
    return next((region for region in get_regions() if region["id"] == region_id), None)


@lru_cache(maxsize=1)
def get_crops() -> List[Dict]:
    rows = _read_csv(DATA_ROOT / "sample_crops.csv")
    return [
        {
            "id": _to_int(row.get("id")),
            "crop_name": row.get("crop_name", ""),
            "category": row.get("category", ""),
            "season": row.get("season", ""),
            "sensitivity_score": _to_float(row.get("sensitivity_score"), 0.5),
        }
        for row in rows
    ]


def get_crop_by_id(crop_id: int) -> Optional[Dict]:
    return next((crop for crop in get_crops() if crop["id"] == crop_id), None)


@lru_cache(maxsize=1)
def _seed_climate_events() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_climate.json")
    events: List[Dict] = []
    for row in rows:
        events.append(
            {
                "id": _to_int(row.get("id")),
                "region_id": _to_int(row.get("region_id")),
                "date": row.get("date"),
                "rainfall": _to_float(row.get("rainfall")),
                "temperature": _to_float(row.get("temperature")),
                "drought_index": _to_float(row.get("drought_index")),
                "flood_probability": _to_float(row.get("flood_probability")),
                "temperature_anomaly": _to_float(row.get("temperature_anomaly")),
                "rainfall_anomaly": _to_float(row.get("rainfall_anomaly")),
                "source": row.get("source", "seed_sample"),
            }
        )
    return events


@lru_cache(maxsize=1)
def get_climate_events() -> List[Dict]:
    seed_events = _seed_climate_events()
    events_by_region: Dict[int, List[Dict]] = defaultdict(list)
    for event in seed_events:
        events_by_region[_to_int(event.get("region_id"))].append(event)

    if settings.use_noaa_realtime:
        for region in get_regions():
            rid = _to_int(region.get("id"))
            lat = _to_float(region.get("latitude"))
            lon = _to_float(region.get("longitude"))
            noaa_events = noaa_service.build_climate_events_from_hourly(rid, lat, lon)
            if noaa_events:
                events_by_region[rid] = noaa_events

    merged: List[Dict] = []
    for rid, items in events_by_region.items():
        for item in items:
            merged.append({**item, "region_id": rid})

    merged.sort(key=lambda item: (_to_int(item.get("region_id")), str(item.get("date", ""))))
    # Reassign deterministic ids after merge.
    for index, item in enumerate(merged, start=1):
        item["id"] = index
    return merged


def get_climate_events_by_region(region_id: int) -> List[Dict]:
    return [event for event in get_climate_events() if event["region_id"] == region_id]


@lru_cache(maxsize=1)
def get_supply_routes() -> List[Dict]:
    rows = _read_csv(DATA_ROOT / "sample_routes.csv")
    return [
        {
            "id": _to_int(row.get("id")),
            "from_region_id": _to_int(row.get("from_region_id")),
            "to_region_id": _to_int(row.get("to_region_id")),
            "route_type": row.get("route_type", "road"),
            "distance_km": _to_float(row.get("distance_km")),
            "travel_time_hr": _to_float(row.get("travel_time_hr")),
            "route_status": row.get("route_status", "open"),
            "disruption_risk": _to_float(row.get("disruption_risk")),
        }
        for row in rows
    ]


def get_routes_for_region(region_id: int) -> List[Dict]:
    return [
        route
        for route in get_supply_routes()
        if route["from_region_id"] == region_id or route["to_region_id"] == region_id
    ]


@lru_cache(maxsize=1)
def get_drought_flood_signals() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_drought_flood.json")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "drought_severity": _to_float(row.get("drought_severity"), 0.0),
            "flood_risk": _to_float(row.get("flood_risk"), 0.0),
            "spi_3m": _to_float(row.get("spi_3m"), 0.0),
            "rainfall_deficit": _to_float(row.get("rainfall_deficit"), 0.0),
        }
        for row in rows
    ]


def get_drought_flood_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_drought_flood_signals(), region_id)


@lru_cache(maxsize=1)
def get_soil_signals() -> List[Dict]:
    rows = _read_csv(DATA_ROOT / "sample_soil_data.csv")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "soil_moisture_index": _to_float(row.get("soil_moisture_index"), 0.5),
            "soil_health_index": _to_float(row.get("soil_health_index"), 0.5),
            "erosion_risk": _to_float(row.get("erosion_risk"), 0.0),
        }
        for row in rows
    ]


def get_soil_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_soil_signals(), region_id)


@lru_cache(maxsize=1)
def get_irrigation_water_signals() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_irrigation_water.json")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "irrigation_coverage": _to_float(row.get("irrigation_coverage"), 0.5),
            "water_stress_index": _to_float(row.get("water_stress_index"), 0.5),
            "reservoir_level": _to_float(row.get("reservoir_level"), 0.5),
        }
        for row in rows
    ]


def get_irrigation_water_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_irrigation_water_signals(), region_id)


@lru_cache(maxsize=1)
def get_market_price_signals() -> List[Dict]:
    rows = _read_csv(DATA_ROOT / "sample_market_prices.csv")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "staple_price_index": _to_float(row.get("staple_price_index"), 100.0),
            "price_anomaly": _to_float(row.get("price_anomaly"), 0.0),
            "price_volatility": _to_float(row.get("price_volatility"), 0.0),
        }
        for row in rows
    ]


def get_market_prices_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_market_price_signals(), region_id)


@lru_cache(maxsize=1)
def get_transport_network_signals() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_transport_network.json")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "network_delay_risk": _to_float(row.get("network_delay_risk"), 0.0),
            "port_rail_road_disruption": _to_float(row.get("port_rail_road_disruption"), 0.0),
            "alternate_path_score": _to_float(row.get("alternate_path_score"), 0.5),
        }
        for row in rows
    ]


def get_transport_network_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_transport_network_signals(), region_id)


@lru_cache(maxsize=1)
def get_storage_signals() -> List[Dict]:
    rows = _read_csv(DATA_ROOT / "sample_storage.csv")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "storage_fill_ratio": _to_float(row.get("storage_fill_ratio"), 0.5),
            "strategic_reserve_days": _to_float(row.get("strategic_reserve_days"), 0.0),
            "storage_risk": _to_float(row.get("storage_risk"), 0.0),
        }
        for row in rows
    ]


def get_storage_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_storage_signals(), region_id)


@lru_cache(maxsize=1)
def get_satellite_imagery_signals() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_satellite_imagery.json")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "ndvi_anomaly": _to_float(row.get("ndvi_anomaly"), 0.0),
            "hotspot_index": _to_float(row.get("hotspot_index"), 0.0),
            "flood_extent_index": _to_float(row.get("flood_extent_index"), 0.0),
        }
        for row in rows
    ]


def get_satellite_imagery_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_satellite_imagery_signals(), region_id)


@lru_cache(maxsize=1)
def get_social_news_signals() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_social_news.json")
    return [
        {
            "region_id": _to_int(row.get("region_id")),
            "date": row.get("date", ""),
            "social_signal_score": _to_float(row.get("social_signal_score"), 0.0),
            "news_disruption_score": _to_float(row.get("news_disruption_score"), 0.0),
            "confidence": _to_float(row.get("confidence"), 0.5),
        }
        for row in rows
    ]


def get_social_news_by_region(region_id: int) -> Dict:
    return _latest_region_row(get_social_news_signals(), region_id)


@lru_cache(maxsize=1)
def get_crop_production_summary_by_state() -> Dict[str, Dict]:
    """Compute yield-drop and volatility features from crop_production.csv by state."""
    if not CROP_PRODUCTION_PATH.exists():
        return {}

    target_states: Dict[str, str] = {}
    for region in get_regions():
        state = str(region.get("state", "")).strip()
        if state:
            target_states[_normalize_state(state)] = state

    if not target_states:
        return {}

    state_year_production: Dict[str, Dict[int, float]] = defaultdict(lambda: defaultdict(float))
    state_crop_year_production: Dict[str, Dict[int, Dict[str, float]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(float))
    )

    with CROP_PRODUCTION_PATH.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            state_raw = str(row.get("State_Name", "")).strip()
            state_key = _normalize_state(state_raw)
            if state_key not in target_states:
                continue

            year = _to_int(row.get("Crop_Year"))
            crop = str(row.get("Crop", "")).strip()
            production = max(_to_float(row.get("Production"), 0.0), 0.0)

            if year <= 0:
                continue

            state_year_production[state_key][year] += production
            if crop:
                state_crop_year_production[state_key][year][crop] += production

    summaries: Dict[str, Dict] = {}
    for state_key, year_totals in state_year_production.items():
        years = sorted(year_totals.keys())
        if not years:
            continue

        latest_year = years[-1]
        baseline_years = years[-4:-1] if len(years) > 1 else years
        if not baseline_years:
            baseline_years = years

        baseline_production = mean(year_totals[year] for year in baseline_years)
        latest_production = year_totals[latest_year]

        raw_drop = 0.0
        if baseline_production > 0:
            raw_drop = (baseline_production - latest_production) / baseline_production
        yield_drop_ratio = _clamp(raw_drop, 0.0, 1.0)

        recent_values = [year_totals[year] for year in years[-5:]]
        avg_recent = mean(recent_values) if recent_values else 0.0
        raw_volatility = 0.0
        if avg_recent > 0 and recent_values:
            raw_volatility = (max(recent_values) - min(recent_values)) / avg_recent
        production_volatility = _clamp(raw_volatility, 0.0, 1.0)

        latest_crops = state_crop_year_production[state_key].get(latest_year, {})
        top_crops = [name for name, _ in sorted(latest_crops.items(), key=lambda item: item[1], reverse=True)[:3]]

        summaries[state_key] = {
            "state_name": target_states[state_key],
            "latest_year": latest_year,
            "latest_production": round(latest_production, 2),
            "baseline_production": round(baseline_production, 2),
            "yield_drop_ratio": round(yield_drop_ratio, 4),
            "production_volatility": round(production_volatility, 4),
            "top_crops": top_crops,
        }

    return summaries


def get_crop_production_signals_for_region(region_id: int) -> Dict:
    region = get_region_by_id(region_id)
    if not region:
        return {}

    state_key = _normalize_state(str(region.get("state", "")))
    summary = get_crop_production_summary_by_state().get(state_key, {})
    if not summary:
        return {
            "crop_yield_drop_ratio": 0.12,
            "crop_production_volatility": 0.25,
            "top_crops": [],
            "stats_year": None,
        }

    return {
        "crop_yield_drop_ratio": _to_float(summary.get("yield_drop_ratio"), 0.12),
        "crop_production_volatility": _to_float(summary.get("production_volatility"), 0.25),
        "top_crops": summary.get("top_crops", []),
        "stats_year": summary.get("latest_year"),
    }


@lru_cache(maxsize=1)
def get_crop_patterns() -> List[Dict]:
    regions = get_regions()
    crops = get_crops()
    if not regions or not crops:
        return []

    state_summaries = get_crop_production_summary_by_state()
    patterns: List[Dict] = []
    pid = 1

    for region in regions:
        state_key = _normalize_state(str(region.get("state", "")))
        summary = state_summaries.get(state_key, {})
        base_drop = _to_float(summary.get("yield_drop_ratio"), 0.12)
        volatility = _to_float(summary.get("production_volatility"), 0.25)
        top_crops = {name.strip().lower() for name in summary.get("top_crops", [])}

        selected_crops = [crop for crop in crops if crop["crop_name"].strip().lower() in top_crops]
        if not selected_crops:
            selected_crops = crops[:2]

        for index, crop in enumerate(selected_crops[:2]):
            shift = (region["id"] + index) % 3
            yield_drop_ratio = _clamp(base_drop + 0.03 * shift + 0.08 * volatility, 0.02, 0.9)
            sensitivity_score = _clamp(crop["sensitivity_score"] + 0.15 * volatility, 0.1, 1.0)
            yield_health = max(0.0, 1.0 - yield_drop_ratio)

            patterns.append(
                {
                    "id": pid,
                    "region_id": region["id"],
                    "crop_id": crop["id"],
                    "season": crop["season"],
                    "yield_history": [
                        round(100 * min(1.0, yield_health + 0.08), 2),
                        round(100 * min(1.0, yield_health + 0.03), 2),
                        round(100 * yield_health, 2),
                    ],
                    "yield_drop_ratio": round(yield_drop_ratio, 4),
                    "planting_cycle": {"start_month": 6, "end_month": 10},
                    "sensitivity_score": round(sensitivity_score, 4),
                }
            )
            pid += 1
    return patterns


def get_crop_patterns_by_region(region_id: int) -> List[Dict]:
    return [pattern for pattern in get_crop_patterns() if pattern["region_id"] == region_id]


def get_external_signals_for_region(region_id: int) -> Dict[str, float]:
    drought_flood = get_drought_flood_by_region(region_id)
    soil = get_soil_by_region(region_id)
    irrigation = get_irrigation_water_by_region(region_id)
    market = get_market_prices_by_region(region_id)
    transport = get_transport_network_by_region(region_id)
    storage = get_storage_by_region(region_id)
    satellite = get_satellite_imagery_by_region(region_id)
    social = get_social_news_by_region(region_id)
    crop_stats = get_crop_production_signals_for_region(region_id)

    return {
        "drought_index_external": _to_float(drought_flood.get("drought_severity"), 0.0),
        "flood_probability_external": _to_float(drought_flood.get("flood_risk"), 0.0),
        "soil_moisture_index": _to_float(soil.get("soil_moisture_index"), 0.5),
        "soil_health_index": _to_float(soil.get("soil_health_index"), 0.5),
        "erosion_risk": _to_float(soil.get("erosion_risk"), 0.0),
        "irrigation_coverage": _to_float(irrigation.get("irrigation_coverage"), 0.5),
        "water_stress_index": _to_float(irrigation.get("water_stress_index"), 0.5),
        "reservoir_level": _to_float(irrigation.get("reservoir_level"), 0.5),
        "market_price_anomaly": _to_float(market.get("price_anomaly"), 0.0),
        "market_price_volatility": _to_float(market.get("price_volatility"), 0.0),
        "transport_delay_risk": _to_float(transport.get("network_delay_risk"), 0.0),
        "transport_disruption_index": _to_float(transport.get("port_rail_road_disruption"), 0.0),
        "alternate_path_score": _to_float(transport.get("alternate_path_score"), 0.5),
        "storage_fill_ratio": _to_float(storage.get("storage_fill_ratio"), 0.5),
        "strategic_reserve_days": _to_float(storage.get("strategic_reserve_days"), 0.0),
        "storage_risk": _to_float(storage.get("storage_risk"), 0.0),
        "ndvi_anomaly": _to_float(satellite.get("ndvi_anomaly"), 0.0),
        "satellite_hotspot_index": _to_float(satellite.get("hotspot_index"), 0.0),
        "satellite_flood_extent_index": _to_float(satellite.get("flood_extent_index"), 0.0),
        "social_signal_score": _to_float(social.get("social_signal_score"), 0.0),
        "news_disruption_score": _to_float(social.get("news_disruption_score"), 0.0),
        "social_confidence": _to_float(social.get("confidence"), 0.5),
        "crop_yield_drop_ratio": _to_float(crop_stats.get("crop_yield_drop_ratio"), 0.12),
        "crop_production_volatility": _to_float(crop_stats.get("crop_production_volatility"), 0.25),
    }


@lru_cache(maxsize=1)
def _seed_alerts() -> List[Dict]:
    rows = _read_json(DATA_ROOT / "sample_alerts.json")
    alerts: List[Dict] = []
    for row in rows:
        alerts.append(
            {
                "id": _to_int(row.get("id")),
                "region_id": _to_int(row.get("region_id")),
                "alert_type": row.get("alert_type", "risk_threshold"),
                "severity": row.get("severity", "medium"),
                "message": row.get("message", ""),
                "status": row.get("status", "active"),
                "created_at": row.get("created_at", datetime.now(timezone.utc).isoformat()),
                "reason": row.get("reason"),
                "recommended_action": row.get("recommended_action"),
            }
        )
    return alerts


_runtime_alerts: List[Dict] = []


def get_alerts() -> List[Dict]:
    if not _runtime_alerts:
        _runtime_alerts.extend(_seed_alerts())
    return list(_runtime_alerts)


def save_alert(alert: Dict) -> Dict:
    alerts = get_alerts()
    new_id = max((item["id"] for item in alerts), default=0) + 1
    alert["id"] = new_id
    if "created_at" not in alert:
        alert["created_at"] = datetime.now(timezone.utc).isoformat()
    _runtime_alerts.append(alert)
    return alert


def update_alert(alert_id: int, status: str) -> Optional[Dict]:
    for alert in _runtime_alerts:
        if alert["id"] == alert_id:
            alert["status"] = status
            return alert
    return None
