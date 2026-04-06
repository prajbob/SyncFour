"""Feature engineering helpers for risk prediction."""

from __future__ import annotations

from statistics import mean
from typing import Dict, List, Optional


def _safe_mean(values: List[float], default: float = 0.0) -> float:
    cleaned = [float(v) for v in values if v is not None]
    if not cleaned:
        return default
    return float(mean(cleaned))


def _latest_or_default(records: List[Dict], key: str, default: float = 0.0) -> float:
    if not records:
        return default
    latest = records[-1]
    value = latest.get(key, default)
    return float(value if value is not None else default)


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def build_region_features(
    climate_events: List[Dict],
    crop_patterns: List[Dict],
    region_routes: List[Dict],
    region_priority: int,
    external_signals: Optional[Dict[str, float]] = None,
) -> Dict[str, float]:
    """Build model-ready features from climate, crop, route, and external API sample signals."""
    signals = external_signals or {}

    rainfall_values = [event.get("rainfall", 0.0) for event in climate_events]
    rainfall_baseline = _safe_mean(rainfall_values, default=0.0)
    latest_rainfall = _latest_or_default(climate_events, "rainfall", default=rainfall_baseline)
    rainfall_anomaly = latest_rainfall - rainfall_baseline

    drought_primary = _latest_or_default(climate_events, "drought_index", default=0.0)
    flood_primary = _latest_or_default(climate_events, "flood_probability", default=0.0)
    drought_external = float(signals.get("drought_index_external", drought_primary))
    flood_external = float(signals.get("flood_probability_external", flood_primary))
    drought_index = 0.6 * drought_primary + 0.4 * drought_external
    flood_probability = 0.6 * flood_primary + 0.4 * flood_external

    temperature_anomaly = _latest_or_default(climate_events, "temperature_anomaly", default=0.0)

    sensitivity = _safe_mean([pattern.get("sensitivity_score", 0.5) for pattern in crop_patterns], default=0.5)
    yield_drop = _safe_mean([pattern.get("yield_drop_ratio", 0.0) for pattern in crop_patterns], default=0.0)

    crop_yield_drop_external = float(signals.get("crop_yield_drop_ratio", yield_drop))
    crop_volatility = float(signals.get("crop_production_volatility", 0.2))
    yield_drop = _clamp(0.55 * yield_drop + 0.45 * crop_yield_drop_external)
    sensitivity = _clamp(sensitivity + 0.10 * crop_volatility)

    route_disruption_risk = _safe_mean([route.get("disruption_risk", 0.0) for route in region_routes], default=0.0)
    transport_delay_risk = float(signals.get("transport_delay_risk", 0.0))
    transport_disruption_index = float(signals.get("transport_disruption_index", 0.0))
    route_disruption_risk = _clamp(0.65 * route_disruption_risk + 0.20 * transport_delay_risk + 0.15 * transport_disruption_index)

    open_routes = [route for route in region_routes if route.get("route_status", "open") == "open"]
    route_redundancy = min(len(open_routes) / max(len(region_routes), 1), 1.0)
    alternate_path_score = float(signals.get("alternate_path_score", route_redundancy))
    route_redundancy = _clamp(0.75 * route_redundancy + 0.25 * alternate_path_score)

    ndvi_anomaly = float(signals.get("ndvi_anomaly", 0.0))
    crop_yield_history = _clamp(1.0 - yield_drop + 0.12 * ndvi_anomaly)

    return {
        "rainfall_anomaly": rainfall_anomaly,
        "temperature_anomaly": temperature_anomaly,
        "drought_index": _clamp(drought_index),
        "flood_probability": _clamp(flood_probability),
        "crop_yield_history": crop_yield_history,
        "crop_vulnerability": _clamp(sensitivity),
        "crop_production_volatility": _clamp(crop_volatility),
        "route_disruption_risk": route_disruption_risk,
        "route_redundancy": route_redundancy,
        "soil_moisture_index": _clamp(float(signals.get("soil_moisture_index", 0.5))),
        "soil_health_index": _clamp(float(signals.get("soil_health_index", 0.5))),
        "erosion_risk": _clamp(float(signals.get("erosion_risk", 0.0))),
        "irrigation_coverage": _clamp(float(signals.get("irrigation_coverage", 0.5))),
        "water_stress_index": _clamp(float(signals.get("water_stress_index", 0.5))),
        "reservoir_level": _clamp(float(signals.get("reservoir_level", 0.5))),
        "market_price_anomaly": _clamp(float(signals.get("market_price_anomaly", 0.0))),
        "market_price_volatility": _clamp(float(signals.get("market_price_volatility", 0.0))),
        "transport_delay_risk": _clamp(transport_delay_risk),
        "transport_disruption_index": _clamp(transport_disruption_index),
        "storage_fill_ratio": _clamp(float(signals.get("storage_fill_ratio", 0.5))),
        "storage_risk": _clamp(float(signals.get("storage_risk", 0.0))),
        "strategic_reserve_days": max(0.0, float(signals.get("strategic_reserve_days", 0.0))),
        "ndvi_anomaly": ndvi_anomaly,
        "satellite_hotspot_index": _clamp(float(signals.get("satellite_hotspot_index", 0.0))),
        "satellite_flood_extent_index": _clamp(float(signals.get("satellite_flood_extent_index", 0.0))),
        "social_signal_score": _clamp(float(signals.get("social_signal_score", 0.0))),
        "news_disruption_score": _clamp(float(signals.get("news_disruption_score", 0.0))),
        "social_confidence": _clamp(float(signals.get("social_confidence", 0.5))),
        "region_priority": float(region_priority),
    }

