"""Runtime configuration for backend services."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import List


def _as_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _as_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _as_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_csv(name: str, default: str) -> List[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str
    environment: str
    debug: bool
    database_url: str
    allowed_origins: List[str]
    data_dir: str
    processed_dir: str
    climate_weight: float
    crop_weight: float
    route_weight: float
    alert_risk_threshold: float
    alert_flood_threshold: float
    alert_drought_threshold: float
    default_forecast_horizon_days: int
    use_noaa_realtime: bool
    noaa_user_agent: str
    noaa_timeout_sec: int
    noaa_max_periods: int


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Climate-Crop-Supply Intelligence API"),
        environment=os.getenv("ENVIRONMENT", "development"),
        debug=_as_bool("DEBUG", True),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./food_security.db"),
        allowed_origins=_as_csv("ALLOWED_ORIGINS", "*"),
        data_dir=os.getenv("DATA_DIR", "data/sample"),
        processed_dir=os.getenv("PROCESSED_DIR", "data/processed"),
        climate_weight=_as_float("CLIMATE_WEIGHT", 0.45),
        crop_weight=_as_float("CROP_WEIGHT", 0.30),
        route_weight=_as_float("ROUTE_WEIGHT", 0.25),
        alert_risk_threshold=_as_float("ALERT_RISK_THRESHOLD", 0.75),
        alert_flood_threshold=_as_float("ALERT_FLOOD_THRESHOLD", 0.70),
        alert_drought_threshold=_as_float("ALERT_DROUGHT_THRESHOLD", 0.70),
        default_forecast_horizon_days=_as_int("DEFAULT_FORECAST_HORIZON_DAYS", 14),
        use_noaa_realtime=_as_bool("USE_NOAA_REALTIME", True),
        noaa_user_agent=os.getenv("NOAA_USER_AGENT", "AgroShieldAI/1.0 (dev@agroshield.local)"),
        noaa_timeout_sec=_as_int("NOAA_TIMEOUT_SEC", 12),
        noaa_max_periods=_as_int("NOAA_MAX_PERIODS", 8),
    )
