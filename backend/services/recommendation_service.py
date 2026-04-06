"""Converts risk outputs into actionable recommendations."""

from __future__ import annotations

from typing import Dict, List


def _severity_priority_map(risk_level: str) -> str:
    if risk_level == "critical":
        return "urgent"
    if risk_level == "high":
        return "high"
    if risk_level == "medium":
        return "medium"
    return "low"


def get_primary_recommendation(prediction: Dict) -> str:
    level = prediction.get("risk_level", "low")
    shortage = prediction.get("shortage_risk", 0.0)
    disruption = prediction.get("disruption_risk", 0.0)

    if level == "critical" and disruption >= shortage:
        return "Activate emergency rerouting and release strategic stock within 24 hours."
    if level == "critical":
        return "Deploy rapid food assistance and prioritize resilient crop zones immediately."
    if level == "high" and disruption >= shortage:
        return "Shift shipments to alternate corridors and increase buffer stock by 20%."
    if level == "high":
        return "Pre-position relief inventory and issue district-level farm advisories."
    if level == "medium":
        return "Increase monitoring cadence, validate route reliability, and prepare contingency plans."
    return "Continue routine monitoring and maintain standard supply planning."


def get_recommendation_bundle(prediction: Dict) -> List[Dict]:
    primary = get_primary_recommendation(prediction)
    level = prediction.get("risk_level", "low")
    priority = _severity_priority_map(level)
    return [
        {"type": "primary", "priority": priority, "text": primary},
        {
            "type": "monitoring",
            "priority": "medium",
            "text": "Track drought, flood, and route indicators every 12 hours for watched regions.",
        },
        {
            "type": "coordination",
            "priority": "medium",
            "text": "Share alert context with government, NGO, and supply teams through webhook digest.",
        },
    ]

