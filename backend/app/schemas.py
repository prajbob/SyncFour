"""Pydantic schemas for API request and response contracts."""

from __future__ import annotations

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class RegionBase(BaseModel):
    id: int
    name: str
    country: str
    state: Optional[str] = None
    latitude: float
    longitude: float
    priority_level: int = 1


class RegionRisk(RegionBase):
    risk_score: float = 0.0
    risk_level: str = "low"
    shortage_risk: float = 0.0
    disruption_risk: float = 0.0


class ClimateSignal(BaseModel):
    date: date
    rainfall: float
    temperature: float
    drought_index: float
    flood_probability: float
    temperature_anomaly: float
    rainfall_anomaly: float = 0.0


class RouteSummary(BaseModel):
    id: int
    from_region_id: int
    to_region_id: int
    route_type: str
    distance_km: float
    travel_time_hr: float
    route_status: str
    disruption_risk: float
    alternate_paths: List[int] = Field(default_factory=list)


class RiskPredictionResponse(BaseModel):
    region_id: int
    crop_id: Optional[int] = None
    forecast_horizon_days: int
    shortage_risk: float
    disruption_risk: float
    combined_risk_score: float
    risk_level: str
    confidence: float
    explanation: str
    recommended_action: str


class PredictRiskRequest(BaseModel):
    region_id: int
    crop_id: Optional[int] = None
    forecast_horizon_days: int = 14
    override_signals: Optional[Dict[str, float]] = None


class AlertItem(BaseModel):
    id: int
    region_id: int
    alert_type: str
    severity: str
    message: str
    status: str
    created_at: datetime
    reason: Optional[str] = None
    recommended_action: Optional[str] = None


class AlertSubscriptionRequest(BaseModel):
    user_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    webhook_url: Optional[str] = None
    regions: List[int] = Field(default_factory=list)
    channels: List[str] = Field(default_factory=list)


class DashboardSummary(BaseModel):
    top_risk_regions: List[RegionRisk]
    active_alerts: List[AlertItem]
    system_metrics: Dict[str, float]
    current_risk_snapshot: Dict[str, float]

