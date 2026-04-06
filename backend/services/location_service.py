"""Location-based insights derived from nearest monitored region."""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Dict, List

from backend.services import data_store
from backend.services.alert_service import get_alerts
from backend.services.climate_service import get_region_climate_history
from backend.services.recommendation_service import get_recommendation_bundle
from backend.services.risk_engine import predict_region_risk


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def find_nearest_region(latitude: float, longitude: float) -> Dict:
    regions = data_store.get_regions()
    if not regions:
        raise ValueError("No regions available in datastore")

    nearest = None
    nearest_distance = float("inf")
    for region in regions:
        distance = _haversine_km(latitude, longitude, float(region["latitude"]), float(region["longitude"]))
        if distance < nearest_distance:
            nearest = region
            nearest_distance = distance

    if not nearest:
        raise ValueError("Unable to map location to a region")

    return {**nearest, "distance_km": round(nearest_distance, 2)}


def _build_disaster_outlook(prediction: Dict, signals: Dict[str, float], latest_climate: Dict) -> List[Dict]:
    outlook: List[Dict] = []

    drought = float(signals.get("drought_index_external", latest_climate.get("drought_index", 0.0)))
    flood = float(signals.get("flood_probability_external", latest_climate.get("flood_probability", 0.0)))
    heat = float(latest_climate.get("temperature_anomaly", 0.0))
    soil_moisture = float(signals.get("soil_moisture_index", 0.5))
    transport = float(signals.get("transport_disruption_index", 0.0))

    if drought >= 0.7:
        outlook.append(
            {
                "type": "drought",
                "severity": "high" if drought < 0.85 else "critical",
                "message": "Drought pressure is elevated. Crop stress and reduced yields are likely.",
            }
        )
    if flood >= 0.7 or float(signals.get("satellite_flood_extent_index", 0.0)) >= 0.6:
        outlook.append(
            {
                "type": "flood",
                "severity": "high" if flood < 0.85 else "critical",
                "message": "Flood risk is elevated. Transport delays and field damage are possible.",
            }
        )
    if heat >= 1.5:
        outlook.append(
            {
                "type": "heat-stress",
                "severity": "medium" if heat < 2.5 else "high",
                "message": "Temperature anomaly indicates heat stress for sensitive crops.",
            }
        )
    if soil_moisture <= 0.35:
        outlook.append(
            {
                "type": "soil-moisture-deficit",
                "severity": "medium" if soil_moisture > 0.25 else "high",
                "message": "Soil moisture is low. Irrigation planning should be tightened.",
            }
        )
    if transport >= 0.6 or prediction.get("disruption_risk", 0.0) >= 0.65:
        outlook.append(
            {
                "type": "transport-disruption",
                "severity": "high",
                "message": "Supply chain disruption risk is elevated due to route/network stress.",
            }
        )

    if not outlook:
        outlook.append(
            {
                "type": "stable",
                "severity": "low",
                "message": "No immediate extreme hazard detected for the nearest monitored region.",
            }
        )
    return outlook


def get_location_insight(latitude: float, longitude: float) -> Dict:
    nearest = find_nearest_region(latitude, longitude)
    region_id = int(nearest["id"])

    prediction = predict_region_risk(region_id)
    climate_history = get_region_climate_history(region_id)
    latest_climate = climate_history[-1] if climate_history else {}
    external_signals = data_store.get_external_signals_for_region(region_id)

    active_alerts = [alert for alert in get_alerts(status="active") if int(alert.get("region_id", -1)) == region_id]
    recommendations = get_recommendation_bundle(prediction)
    disaster_outlook = _build_disaster_outlook(prediction, external_signals, latest_climate)

    return {
        "input_location": {
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        },
        "mapped_region": {
            "id": nearest["id"],
            "name": nearest["name"],
            "state": nearest.get("state"),
            "country": nearest.get("country"),
            "distance_km": nearest["distance_km"],
        },
        "risk_evaluation": {
            "combined_risk_score": prediction["combined_risk_score"],
            "risk_level": prediction["risk_level"],
            "confidence": prediction["confidence"],
            "shortage_risk": prediction["shortage_risk"],
            "disruption_risk": prediction["disruption_risk"],
            "explanation": prediction["explanation"],
            "recommended_action": prediction["recommended_action"],
        },
        "current_signals": {
            "temperature": round(float(latest_climate.get("temperature", 0.0)), 2),
            "rainfall": round(float(latest_climate.get("rainfall", 0.0)), 2),
            "drought_index": round(float(latest_climate.get("drought_index", external_signals.get("drought_index_external", 0.0))), 3),
            "flood_probability": round(float(latest_climate.get("flood_probability", external_signals.get("flood_probability_external", 0.0))), 3),
            "soil_moisture_index": round(float(external_signals.get("soil_moisture_index", 0.5)), 3),
            "water_stress_index": round(float(external_signals.get("water_stress_index", 0.5)), 3),
            "reservoir_level": round(float(external_signals.get("reservoir_level", 0.5)), 3),
            "market_price_anomaly": round(float(external_signals.get("market_price_anomaly", 0.0)), 3),
            "storage_fill_ratio": round(float(external_signals.get("storage_fill_ratio", 0.5)), 3),
            "route_disruption_risk": round(float(external_signals.get("transport_disruption_index", 0.0)), 3),
            "satellite_flood_extent_index": round(float(external_signals.get("satellite_flood_extent_index", 0.0)), 3),
            "ndvi_anomaly": round(float(external_signals.get("ndvi_anomaly", 0.0)), 3),
        },
        "disaster_outlook": disaster_outlook,
        "active_alerts": active_alerts,
        "recommendations": recommendations,
    }

