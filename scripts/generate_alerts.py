"""Convert risk scores into actionable alerts."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.config import get_settings
from backend.services import data_store


def run() -> dict:
    settings = get_settings()
    scores_path = Path("data/processed/risk_scores.json")
    if not scores_path.exists():
        raise FileNotFoundError("Risk scores file not found. Run scripts/compute_scores.py first.")

    scores = json.loads(scores_path.read_text(encoding="utf-8"))
    routes = data_store.get_supply_routes()
    alerts = []
    now = datetime.now(timezone.utc).isoformat()

    for row in scores:
        if row["risk_score"] >= settings.alert_risk_threshold:
            region = data_store.get_region_by_id(row["region_id"])
            region_name = region["name"] if region else f"Region {row['region_id']}"
            alerts.append(
                {
                    "region": region_name,
                    "region_id": row["region_id"],
                    "alert_type": "combined_risk",
                    "severity": row["risk_level"],
                    "reason": f"combined_risk_score >= {settings.alert_risk_threshold}",
                    "recommended_action": row["recommended_action"],
                    "created_at": now,
                }
            )

    for route in routes:
        if route["route_status"] == "blocked":
            alerts.append(
                {
                    "region": f"Route {route['from_region_id']}->{route['to_region_id']}",
                    "region_id": route["from_region_id"],
                    "alert_type": "route_status",
                    "severity": "high",
                    "reason": "route_status equals blocked",
                    "recommended_action": "Use alternate route and increase safety stock.",
                    "created_at": now,
                }
            )

    output_path = Path("data/processed/alerts.json")
    output_path.write_text(json.dumps(alerts, indent=2), encoding="utf-8")
    return {"status": "ok", "output": str(output_path), "records_processed": len(alerts)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
