"""Location-based insight API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.services.location_service import get_location_insight

router = APIRouter()


@router.get("/insight")
def location_insight(
    lat: float = Query(..., description="Latitude in decimal degrees"),
    lon: float = Query(..., description="Longitude in decimal degrees"),
) -> dict:
    if lat < -90 or lat > 90:
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90.")
    if lon < -180 or lon > 180:
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180.")

    try:
        return get_location_insight(latitude=lat, longitude=lon)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

