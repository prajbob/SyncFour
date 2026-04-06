"""Climate-related APIs."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.services import data_store
from backend.services.climate_service import get_region_climate_history, get_region_climate_summary

router = APIRouter()


@router.get("/{region_id}")
def climate_for_region(region_id: int) -> dict:
    region = data_store.get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")
    return {
        "region": region,
        "summary": get_region_climate_summary(region_id),
        "history": get_region_climate_history(region_id),
    }

