"""Scoring and threshold logic for risk fusion."""

from __future__ import annotations

from typing import Dict, Tuple

from backend.app.config import get_settings


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def _ndvi_stress(ndvi_anomaly: float) -> float:
    # NDVI anomaly usually around [-0.4, 0.4]. Negative means vegetation stress.
    return clamp((0.4 - ndvi_anomaly) / 0.8)


def risk_level_from_score(score: float) -> str:
    if score < 0.35:
        return "low"
    if score < 0.65:
        return "medium"
    if score < 0.85:
        return "high"
    return "critical"


def compute_shortage_risk(features: Dict[str, float]) -> float:
    drought_component = clamp(features.get("drought_index", 0.0))
    heat_component = clamp((features.get("temperature_anomaly", 0.0) + 5.0) / 10.0)
    yield_component = clamp(1.0 - features.get("crop_yield_history", 1.0))
    vulnerability_component = clamp(features.get("crop_vulnerability", 0.5))
    soil_stress = clamp(1.0 - features.get("soil_moisture_index", 0.5))
    irrigation_gap = clamp(1.0 - features.get("irrigation_coverage", 0.5))
    water_stress = clamp(features.get("water_stress_index", 0.0))
    market_pressure = clamp(
        0.6 * features.get("market_price_anomaly", 0.0) + 0.4 * features.get("market_price_volatility", 0.0)
    )
    storage_pressure = clamp(0.7 * features.get("storage_risk", 0.0) + 0.3 * (1.0 - features.get("storage_fill_ratio", 0.5)))
    satellite_stress = _ndvi_stress(features.get("ndvi_anomaly", 0.0))

    weighted = (
        0.17 * drought_component
        + 0.08 * heat_component
        + 0.13 * yield_component
        + 0.08 * vulnerability_component
        + 0.10 * soil_stress
        + 0.10 * irrigation_gap
        + 0.10 * water_stress
        + 0.08 * market_pressure
        + 0.09 * storage_pressure
        + 0.07 * satellite_stress
    )
    return clamp(weighted)


def compute_disruption_risk(features: Dict[str, float]) -> float:
    flood_component = clamp(features.get("flood_probability", 0.0))
    route_component = clamp(features.get("route_disruption_risk", 0.0))
    redundancy_component = clamp(1.0 - features.get("route_redundancy", 1.0))
    transport_delay_component = clamp(features.get("transport_delay_risk", 0.0))
    transport_disruption_component = clamp(features.get("transport_disruption_index", 0.0))
    satellite_flood_component = clamp(features.get("satellite_flood_extent_index", 0.0))
    news_component = clamp(
        0.65 * features.get("news_disruption_score", 0.0) + 0.35 * features.get("social_signal_score", 0.0)
    )

    weighted = (
        0.24 * flood_component
        + 0.22 * route_component
        + 0.12 * redundancy_component
        + 0.14 * transport_delay_component
        + 0.11 * transport_disruption_component
        + 0.09 * satellite_flood_component
        + 0.08 * news_component
    )
    return clamp(weighted)


def compute_confidence(features: Dict[str, float]) -> float:
    quality_signals = [
        abs(features.get("rainfall_anomaly", 0.0)) <= 500,
        abs(features.get("temperature_anomaly", 0.0)) <= 20,
        0.0 <= features.get("drought_index", 0.0) <= 1.0,
        0.0 <= features.get("flood_probability", 0.0) <= 1.0,
        0.0 <= features.get("route_disruption_risk", 0.0) <= 1.0,
        -1.0 <= features.get("ndvi_anomaly", 0.0) <= 1.0,
        0.0 <= features.get("storage_fill_ratio", 0.0) <= 1.0,
        0.0 <= features.get("social_confidence", 0.0) <= 1.0,
    ]
    valid_ratio = sum(1 for signal in quality_signals if signal) / len(quality_signals)
    source_confidence = features.get("social_confidence", 0.5)
    return clamp(0.55 + 0.35 * valid_ratio + 0.10 * source_confidence)


def weighted_risk_fusion(shortage_risk: float, disruption_risk: float, features: Dict[str, float]) -> float:
    settings = get_settings()
    climate_proxy = clamp(
        0.45 * features.get("drought_index", 0.0)
        + 0.35 * features.get("flood_probability", 0.0)
        + 0.20 * clamp(features.get("water_stress_index", 0.0))
    )
    crop_proxy = clamp(0.8 * shortage_risk + 0.2 * features.get("crop_production_volatility", 0.0))
    route_proxy = clamp(disruption_risk)

    fused = (
        settings.climate_weight * climate_proxy
        + settings.crop_weight * crop_proxy
        + settings.route_weight * route_proxy
    )
    critical_pressure = clamp(
        max(
            features.get("drought_index", 0.0),
            features.get("flood_probability", 0.0),
            features.get("water_stress_index", 0.0),
            features.get("route_disruption_risk", 0.0),
            features.get("market_price_anomaly", 0.0),
        )
    )
    return clamp(0.75 * fused + 0.25 * critical_pressure)


def score_features(features: Dict[str, float]) -> Tuple[float, float, float, str, float]:
    shortage = compute_shortage_risk(features)
    disruption = compute_disruption_risk(features)
    combined = weighted_risk_fusion(shortage, disruption, features)
    level = risk_level_from_score(combined)
    confidence = compute_confidence(features)
    return shortage, disruption, combined, level, confidence
