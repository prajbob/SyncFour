"""Prediction APIs."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.app.schemas import PredictRiskRequest
from backend.services.risk_engine import predict_region_risk

router = APIRouter()


@router.post("/risk")
def predict_risk(payload: PredictRiskRequest) -> dict:
    try:
        prediction = predict_region_risk(
            region_id=payload.region_id,
            crop_id=payload.crop_id,
            forecast_horizon_days=payload.forecast_horizon_days,
            override_signals=payload.override_signals,
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return prediction

