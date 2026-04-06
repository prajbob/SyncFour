"""Alert generation, status updates, and subscriptions."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.app.config import get_settings
from backend.services import data_store
from backend.services.risk_engine import list_region_risk_predictions, predict_region_risk
from backend.services.route_service import get_blocked_routes

_subscriptions: List[Dict] = []


def _severity_from_score(score: float) -> str:
    if score >= 0.85:
        return "critical"
    if score >= 0.65:
        return "high"
    if score >= 0.35:
        return "medium"
    return "low"


def get_alerts(status: Optional[str] = None) -> List[Dict]:
    alerts = data_store.get_alerts()
    normalized = []
    for alert in alerts:
        normalized.append(
            {
                **alert,
                "created_at": datetime.fromisoformat(str(alert["created_at"])).isoformat(),
            }
        )
    if status:
        return [alert for alert in normalized if alert["status"] == status]
    return normalized


def subscribe(payload: Dict) -> Dict:
    record = {
        "id": len(_subscriptions) + 1,
        "user_name": payload.get("user_name"),
        "email": payload.get("email"),
        "phone": payload.get("phone"),
        "webhook_url": payload.get("webhook_url"),
        "regions": payload.get("regions", []),
        "channels": payload.get("channels", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _subscriptions.append(record)
    return record


def update_alert_status(alert_id: int, status: str) -> Optional[Dict]:
    updated = data_store.update_alert(alert_id, status)
    return updated


def create_alert_from_prediction(prediction: Dict, reason: str) -> Dict:
    region = data_store.get_region_by_id(prediction["region_id"])
    region_name = region["name"] if region else f"Region {prediction['region_id']}"
    message = (
        f"{region_name}: {prediction['risk_level'].upper()} risk "
        f"(score {prediction['combined_risk_score']}) for food shortage or delivery disruption."
    )
    payload = {
        "region_id": prediction["region_id"],
        "alert_type": "risk_threshold",
        "severity": _severity_from_score(prediction["combined_risk_score"]),
        "message": message,
        "status": "active",
        "reason": reason,
        "recommended_action": prediction["recommended_action"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return data_store.save_alert(payload)


def generate_alerts() -> List[Dict]:
    settings = get_settings()
    generated: List[Dict] = []

    for prediction in list_region_risk_predictions():
        if prediction["risk_score"] >= settings.alert_risk_threshold:
            full_prediction = predict_region_risk(prediction["id"])
            generated.append(
                create_alert_from_prediction(
                    full_prediction,
                    reason=f"combined risk score >= {settings.alert_risk_threshold}",
                )
            )

    blocked_routes = get_blocked_routes()
    for route in blocked_routes:
        payload = {
            "region_id": route["from_region_id"],
            "alert_type": "route_blocked",
            "severity": "high",
            "message": f"Route {route['id']} is blocked between regions {route['from_region_id']} and {route['to_region_id']}.",
            "status": "active",
            "reason": "route status equals blocked",
            "recommended_action": "Reroute shipments through available alternate routes immediately.",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        generated.append(data_store.save_alert(payload))
    return generated


def create_test_alert(region_id: int) -> Dict:
    prediction = predict_region_risk(region_id)
    return create_alert_from_prediction(prediction, reason="manual test alert")
