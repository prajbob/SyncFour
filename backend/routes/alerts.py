"""Alert management APIs."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas import AlertSubscriptionRequest
from backend.services.alert_service import (
    create_test_alert,
    generate_alerts,
    get_alerts,
    subscribe,
    update_alert_status,
)

router = APIRouter()


@router.get("")
def list_alerts(status: str | None = Query(default=None)) -> dict:
    items = get_alerts(status=status)
    return {"count": len(items), "items": items}


@router.post("/generate")
def run_alert_generation() -> dict:
    alerts = generate_alerts()
    return {"generated": len(alerts), "items": alerts}


@router.post("/subscribe")
def subscribe_alerts(payload: AlertSubscriptionRequest) -> dict:
    record = subscribe(payload.model_dump())
    return {"subscription": record}


@router.post("/test")
def create_manual_test_alert(region_id: int) -> dict:
    try:
        alert = create_test_alert(region_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"alert": alert}


@router.patch("/{alert_id}")
def patch_alert(alert_id: int, status: str) -> dict:
    updated = update_alert_status(alert_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return {"alert": updated}

