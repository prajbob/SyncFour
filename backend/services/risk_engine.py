"""Combines climate, crop, route, and auxiliary signals into final risk predictions."""

from __future__ import annotations

from typing import Dict, List, Optional

from backend.app.config import get_settings
from backend.core.feature_engineering import build_region_features
from backend.core.scoring import score_features
from backend.services import data_store
from backend.services.recommendation_service import get_primary_recommendation
from backend.services.route_service import compute_route_redundancy, get_routes_by_region


def _build_explanation(features: Dict[str, float], level: str) -> str:
    reasons: List[str] = []

    if features.get("drought_index", 0.0) >= 0.7:
        reasons.append("drought severity is high")
    if features.get("flood_probability", 0.0) >= 0.7:
        reasons.append("flood probability is elevated")
    if features.get("temperature_anomaly", 0.0) >= 1.5:
        reasons.append("temperature anomaly indicates heat stress")
    if features.get("soil_moisture_index", 1.0) <= 0.35:
        reasons.append("soil moisture is below healthy levels")
    if features.get("water_stress_index", 0.0) >= 0.65:
        reasons.append("irrigation and water stress signals are elevated")
    if features.get("market_price_anomaly", 0.0) >= 0.6:
        reasons.append("market prices show supply pressure")
    if features.get("route_disruption_risk", 0.0) >= 0.6:
        reasons.append("transport network disruption risk is significant")
    if features.get("route_redundancy", 1.0) <= 0.3:
        reasons.append("route redundancy is weak")
    if features.get("news_disruption_score", 0.0) >= 0.6:
        reasons.append("social/news disruptions reinforce risk trend")
    if features.get("ndvi_anomaly", 0.0) <= -0.2:
        reasons.append("satellite vegetation anomaly suggests crop stress")

    if not reasons:
        reasons.append("no major trigger exceeded thresholds")
    return f"Risk level is {level} because " + ", ".join(reasons) + "."


def predict_region_risk(
    region_id: int,
    crop_id: Optional[int] = None,
    forecast_horizon_days: Optional[int] = None,
    override_signals: Optional[Dict[str, float]] = None,
) -> Dict:
    settings = get_settings()
    region = data_store.get_region_by_id(region_id)
    if not region:
        raise ValueError(f"Region {region_id} not found")

    climate_events = data_store.get_climate_events_by_region(region_id)
    crop_patterns = data_store.get_crop_patterns_by_region(region_id)
    routes = get_routes_by_region(region_id)
    external_signals = data_store.get_external_signals_for_region(region_id)

    features = build_region_features(
        climate_events=climate_events,
        crop_patterns=crop_patterns,
        region_routes=routes,
        region_priority=region.get("priority_level", 1),
        external_signals=external_signals,
    )
    features["route_redundancy"] = compute_route_redundancy(region_id) if routes else features.get("route_redundancy", 1.0)

    if override_signals:
        for key, value in override_signals.items():
            features[key] = float(value)

    shortage_risk, disruption_risk, combined_score, risk_level, confidence = score_features(features)
    explanation = _build_explanation(features, risk_level)

    prediction = {
        "region_id": region_id,
        "crop_id": crop_id,
        "forecast_horizon_days": forecast_horizon_days or settings.default_forecast_horizon_days,
        "shortage_risk": round(shortage_risk, 4),
        "disruption_risk": round(disruption_risk, 4),
        "combined_risk_score": round(combined_score, 4),
        "risk_level": risk_level,
        "confidence": round(confidence, 4),
        "explanation": explanation,
        "signal_snapshot": {
            "drought_index": round(features.get("drought_index", 0.0), 4),
            "flood_probability": round(features.get("flood_probability", 0.0), 4),
            "soil_moisture_index": round(features.get("soil_moisture_index", 0.0), 4),
            "water_stress_index": round(features.get("water_stress_index", 0.0), 4),
            "market_price_anomaly": round(features.get("market_price_anomaly", 0.0), 4),
            "route_disruption_risk": round(features.get("route_disruption_risk", 0.0), 4),
            "news_disruption_score": round(features.get("news_disruption_score", 0.0), 4),
        },
    }
    prediction["recommended_action"] = get_primary_recommendation(prediction)
    return prediction


def list_region_risk_predictions() -> List[Dict]:
    predictions: List[Dict] = []
    for region in data_store.get_regions():
        prediction = predict_region_risk(region_id=region["id"])
        predictions.append(
            {
                **region,
                "risk_score": prediction["combined_risk_score"],
                "risk_level": prediction["risk_level"],
                "shortage_risk": prediction["shortage_risk"],
                "disruption_risk": prediction["disruption_risk"],
                "confidence": prediction["confidence"],
            }
        )
    predictions.sort(key=lambda item: item["risk_score"], reverse=True)
    return predictions

