"""Dashboard APIs for summary metrics and map payloads."""

from __future__ import annotations

from fastapi import APIRouter

from backend.services.alert_service import get_alerts
from backend.services.risk_engine import list_region_risk_predictions
from backend.services.route_service import route_network_snapshot

router = APIRouter()


@router.get("/summary")
def dashboard_summary() -> dict:
    predictions = list_region_risk_predictions()
    top_risk = predictions[:5]
    alerts = [alert for alert in get_alerts(status="active")][:10]
    network = route_network_snapshot()

    avg_risk = 0.0
    if predictions:
        avg_risk = sum(item["risk_score"] for item in predictions) / len(predictions)

    return {
        "top_risk_regions": top_risk,
        "active_alerts": alerts,
        "system_metrics": {
            "total_regions": len(predictions),
            "active_alerts": len(alerts),
            "avg_risk_score": round(avg_risk, 4),
            **network,
        },
        "current_risk_snapshot": {
            "critical_count": len([item for item in predictions if item["risk_level"] == "critical"]),
            "high_count": len([item for item in predictions if item["risk_level"] == "high"]),
            "medium_count": len([item for item in predictions if item["risk_level"] == "medium"]),
            "low_count": len([item for item in predictions if item["risk_level"] == "low"]),
        },
    }


@router.get("/map-data")
def dashboard_map_data() -> dict:
    predictions = list_region_risk_predictions()
    features = []
    for region in predictions:
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "region_id": region["id"],
                    "name": region["name"],
                    "state": region["state"],
                    "country": region["country"],
                    "risk_score": region["risk_score"],
                    "risk_level": region["risk_level"],
                    "shortage_risk": region["shortage_risk"],
                    "disruption_risk": region["disruption_risk"],
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [region["longitude"], region["latitude"]],
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}

