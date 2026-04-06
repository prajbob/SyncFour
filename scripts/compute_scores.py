"""Combine climate, crop, and route features into final risk scores."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.core.scoring import score_features
from backend.services.recommendation_service import get_primary_recommendation


def run() -> dict:
    features_path = Path("data/processed/features.json")
    if not features_path.exists():
        raise FileNotFoundError("Feature file not found. Run scripts/build_features.py first.")

    rows = json.loads(features_path.read_text(encoding="utf-8"))
    scored = []
    for row in rows:
        features = row.get("features", {})
        shortage, disruption, combined, level, confidence = score_features(features)
        prediction = {
            "region_id": row["region_id"],
            "shortage_risk": round(shortage, 4),
            "disruption_risk": round(disruption, 4),
            "risk_score": round(combined, 4),
            "risk_level": level,
            "confidence": round(confidence, 4),
            "explanation": f"Computed from climate, crop, and route signals for region {row['region_id']}.",
        }
        prediction["recommended_action"] = get_primary_recommendation(
            {
                "risk_level": level,
                "shortage_risk": prediction["shortage_risk"],
                "disruption_risk": prediction["disruption_risk"],
            }
        )
        scored.append(prediction)

    output_path = Path("data/processed/risk_scores.json")
    output_path.write_text(json.dumps(scored, indent=2), encoding="utf-8")
    return {"status": "ok", "output": str(output_path), "records_processed": len(scored)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
