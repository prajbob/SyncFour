"""Optional lightweight training script for demo forecasting."""

from __future__ import annotations

import json
from pathlib import Path
from statistics import mean


def run() -> dict:
    features_path = Path("data/processed/features.json")
    if not features_path.exists():
        raise FileNotFoundError("Feature file not found. Run scripts/build_features.py first.")

    rows = json.loads(features_path.read_text(encoding="utf-8"))
    if not rows:
        raise ValueError("No features available for training.")

    drought_values = [row["features"].get("drought_index", 0.0) for row in rows]
    flood_values = [row["features"].get("flood_probability", 0.0) for row in rows]
    route_values = [row["features"].get("route_disruption_risk", 0.0) for row in rows]

    # This is a baseline coefficient snapshot for demo purposes.
    model = {
        "model_type": "baseline_weighted_regression",
        "version": "0.1",
        "coefficients": {
            "drought_index": round(mean(drought_values), 4),
            "flood_probability": round(mean(flood_values), 4),
            "route_disruption_risk": round(mean(route_values), 4),
        },
        "intercept": 0.1,
        "trained_on_regions": len(rows),
    }

    output_path = Path("data/processed/model_artifact.json")
    output_path.write_text(json.dumps(model, indent=2), encoding="utf-8")
    return {"status": "ok", "output": str(output_path), "trained_on_regions": len(rows)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

