"""Region listing and single-region detail APIs."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.services import data_store
from backend.services.alert_service import get_alerts
from backend.services.climate_service import get_region_climate_history, get_region_climate_summary
from backend.services.crop_service import get_region_crop_patterns, get_crop_stress_signals
from backend.services.recommendation_service import get_recommendation_bundle
from backend.services.risk_engine import list_region_risk_predictions, predict_region_risk
from backend.services.route_service import get_routes_by_region

router = APIRouter()


@router.get("")
def list_regions(
    search: str | None = Query(default=None),
    risk_level: str | None = Query(default=None),
    sort_by: str = Query(default="risk_score"),
    order: str = Query(default="desc"),
) -> dict:
    rows = list_region_risk_predictions()

    if search:
        token = search.strip().lower()
        rows = [item for item in rows if token in item["name"].lower() or token in item["state"].lower()]
    if risk_level:
        rows = [item for item in rows if item["risk_level"] == risk_level.lower()]

    reverse = order.lower() != "asc"
    rows.sort(key=lambda item: item.get(sort_by, 0), reverse=reverse)
    return {"count": len(rows), "items": rows}


@router.get("/{region_id}")
def get_region(region_id: int) -> dict:
    region = data_store.get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")

    prediction = predict_region_risk(region_id)
    climate_summary = get_region_climate_summary(region_id)
    climate_history = get_region_climate_history(region_id)
    crop_patterns = get_region_crop_patterns(region_id)
    crop_stress = get_crop_stress_signals(region_id)
    routes = get_routes_by_region(region_id)
    external_signals = data_store.get_external_signals_for_region(region_id)
    region_alerts = [alert for alert in get_alerts() if alert["region_id"] == region_id]
    recommendations = get_recommendation_bundle(prediction)

    return {
        "region": region,
        "prediction": prediction,
        "climate_summary": climate_summary,
        "climate_history": climate_history,
        "crop_patterns": crop_patterns,
        "crop_stress": crop_stress,
        "routes": routes,
        "api_replacement_signals": external_signals,
        "alert_history": region_alerts,
        "recommended_actions": recommendations,
    }
