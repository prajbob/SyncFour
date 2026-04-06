"""NOAA/NWS real-time weather integration helpers."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from functools import lru_cache
from typing import Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.app.config import get_settings


def _is_noaa_supported_point(lat: float, lon: float) -> bool:
    """api.weather.gov coverage is U.S.-focused; skip unsupported geographies quickly."""
    # Continental US + Alaska/Hawaii/Puerto Rico rough bounds.
    return (
        (24.0 <= lat <= 49.5 and -125.0 <= lon <= -66.5)
        or (51.0 <= lat <= 72.0 and -180.0 <= lon <= -129.0)
        or (18.5 <= lat <= 23.0 and -161.5 <= lon <= -154.0)
        or (17.5 <= lat <= 18.7 and -67.5 <= lon <= -65.0)
    )


def _to_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def _estimate_rainfall_mm(probability: float, short_forecast: str) -> float:
    intensity_multiplier = 1.0
    phrase = short_forecast.lower()
    if "heavy" in phrase or "thunder" in phrase:
        intensity_multiplier = 1.8
    elif "light" in phrase:
        intensity_multiplier = 0.7
    return round(max(0.0, probability * 20.0 * intensity_multiplier), 2)


def _estimate_flood_probability(precip_prob: float, short_forecast: str) -> float:
    phrase = short_forecast.lower()
    multiplier = 1.0
    if "thunder" in phrase or "heavy rain" in phrase:
        multiplier = 1.3
    if "flood" in phrase:
        multiplier = 1.5
    return round(_clamp(precip_prob * multiplier), 4)


def _estimate_drought_index(precip_prob: float, temperature_c: float) -> float:
    dryness = 1.0 - precip_prob
    heat_pressure = _clamp((temperature_c - 20.0) / 20.0)
    return round(_clamp(0.65 * dryness + 0.35 * heat_pressure), 4)


def _parse_temperature_c(period: Dict) -> float:
    temp_value = _to_float(period.get("temperature"), 0.0)
    unit = str(period.get("temperatureUnit", "F")).upper()
    if unit == "F":
        return round((temp_value - 32.0) * (5.0 / 9.0), 2)
    return round(temp_value, 2)


def _parse_precip_probability(period: Dict) -> float:
    precip = period.get("probabilityOfPrecipitation", {})
    value = None
    if isinstance(precip, dict):
        value = precip.get("value")
    if value is None:
        return 0.0
    return _clamp(_to_float(value, 0.0) / 100.0)


def _parse_wind_speed_kph(period: Dict) -> float:
    raw = str(period.get("windSpeed", "0")).strip().split(" ")[0]
    if "-" in raw:
        start = raw.split("-")[0]
        mph = _to_float(start, 0.0)
    else:
        mph = _to_float(raw, 0.0)
    return round(mph * 1.60934, 2)


def _request_json(url: str) -> Dict:
    settings = get_settings()
    request = Request(
        url=url,
        headers={
            "User-Agent": settings.noaa_user_agent,
            "Accept": "application/geo+json, application/json",
        },
    )
    with urlopen(request, timeout=settings.noaa_timeout_sec) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)


@lru_cache(maxsize=256)
def get_points_metadata(lat: float, lon: float) -> Optional[Dict]:
    if not _is_noaa_supported_point(lat, lon):
        return None
    try:
        return _request_json(f"https://api.weather.gov/points/{lat:.4f},{lon:.4f}")
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return None


@lru_cache(maxsize=256)
def get_hourly_forecast(lat: float, lon: float) -> Optional[Dict]:
    points = get_points_metadata(lat, lon)
    if not points:
        return None

    forecast_url = points.get("properties", {}).get("forecastHourly")
    if not forecast_url:
        return None

    try:
        return _request_json(str(forecast_url))
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return None


def build_climate_events_from_hourly(region_id: int, lat: float, lon: float, max_periods: Optional[int] = None) -> List[Dict]:
    """Convert NOAA hourly periods into climate_events-like records."""
    settings = get_settings()
    hourly = get_hourly_forecast(lat, lon)
    if not hourly:
        return []

    periods = hourly.get("properties", {}).get("periods", [])
    if not isinstance(periods, list) or not periods:
        return []

    limit = max_periods or settings.noaa_max_periods
    selected_periods = periods[: max(1, limit)]
    temperatures = [_parse_temperature_c(period) for period in selected_periods]
    baseline_temp = sum(temperatures) / len(temperatures) if temperatures else 0.0

    events: List[Dict] = []
    for index, period in enumerate(selected_periods):
        temperature_c = _parse_temperature_c(period)
        precip_probability = _parse_precip_probability(period)
        short_forecast = str(period.get("shortForecast", ""))

        events.append(
            {
                "id": index + 1,
                "region_id": region_id,
                "date": str(period.get("startTime", datetime.now(timezone.utc).isoformat())),
                "rainfall": _estimate_rainfall_mm(precip_probability, short_forecast),
                "temperature": temperature_c,
                "drought_index": _estimate_drought_index(precip_probability, temperature_c),
                "flood_probability": _estimate_flood_probability(precip_probability, short_forecast),
                "temperature_anomaly": round(temperature_c - baseline_temp, 3),
                "rainfall_anomaly": round((precip_probability - 0.5) * 40.0, 3),
                "wind_speed_kph": _parse_wind_speed_kph(period),
                "weather_condition": short_forecast,
                "source": "noaa_weather_gov_hourly",
            }
        )
    return events


def get_current_conditions(lat: float, lon: float) -> Optional[Dict]:
    """Return normalized current weather using first hourly period."""
    events = build_climate_events_from_hourly(region_id=0, lat=lat, lon=lon, max_periods=1)
    if not events:
        return None
    current = events[0]
    return {
        "temperature": current["temperature"],
        "rainfall": current["rainfall"],
        "drought_index": current["drought_index"],
        "flood_probability": current["flood_probability"],
        "temperature_anomaly": current["temperature_anomaly"],
        "rainfall_anomaly": current["rainfall_anomaly"],
        "wind_speed_kph": current.get("wind_speed_kph", 0.0),
        "weather_condition": current.get("weather_condition", ""),
        "timestamp": current["date"],
        "source": "noaa_weather_gov_hourly",
    }
