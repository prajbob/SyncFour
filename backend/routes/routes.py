"""Supply route APIs."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.services.route_service import get_alternate_paths, get_route_by_id

router = APIRouter()


@router.get("/{route_id}")
def route_detail(route_id: int) -> dict:
    route = get_route_by_id(route_id)
    if not route:
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found")

    return {
        "route": route,
        "alternate_paths": get_alternate_paths(route_id),
        "route_status": route["route_status"],
    }

