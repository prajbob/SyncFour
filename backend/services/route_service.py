"""Supply route graph and disruption helpers."""

from __future__ import annotations

from typing import Dict, List, Optional

from backend.services import data_store


def get_all_routes() -> List[Dict]:
    return data_store.get_supply_routes()


def get_route_by_id(route_id: int) -> Optional[Dict]:
    return next((route for route in get_all_routes() if route["id"] == route_id), None)


def get_routes_by_region(region_id: int) -> List[Dict]:
    return data_store.get_routes_for_region(region_id)


def get_blocked_routes() -> List[Dict]:
    return [route for route in get_all_routes() if route["route_status"] == "blocked"]


def compute_route_redundancy(region_id: int) -> float:
    routes = get_routes_by_region(region_id)
    if not routes:
        return 0.0
    open_count = len([route for route in routes if route["route_status"] == "open"])
    return min(1.0, open_count / max(len(routes), 1))


def get_alternate_paths(route_id: int) -> List[int]:
    route = get_route_by_id(route_id)
    if not route:
        return []
    candidates = []
    for item in get_all_routes():
        if item["id"] == route_id or item["route_status"] != "open":
            continue
        same_source = item["from_region_id"] == route["from_region_id"]
        same_target = item["to_region_id"] == route["to_region_id"]
        reverse_match = (
            item["from_region_id"] == route["to_region_id"] and item["to_region_id"] == route["from_region_id"]
        )
        if same_source or same_target or reverse_match:
            candidates.append(item["id"])
    return candidates[:3]


def route_network_snapshot() -> Dict:
    routes = get_all_routes()
    blocked = get_blocked_routes()
    return {
        "total_routes": len(routes),
        "blocked_routes": len(blocked),
        "open_routes": len(routes) - len(blocked),
    }

