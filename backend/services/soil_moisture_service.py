"""NASA POWER soil moisture integration and seed guidance helpers."""

from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from backend.app.config import get_settings


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def _to_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _yyyymmdd(value: date) -> str:
    return value.strftime("%Y%m%d")


def _request_json(url: str) -> Dict:
    settings = get_settings()
    request = Request(url=url, headers={"Accept": "application/json", "User-Agent": "AgroShieldAI/1.0"})
    with urlopen(request, timeout=settings.nasa_power_timeout_sec) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def _build_seed_suggestions(soil_moisture_percent: float) -> Dict:
    moisture = _clamp(soil_moisture_percent / 100.0)
    if moisture < 0.30:
        return {
            "risk_band": "high",
            "advisory": "Soil is dry. Prefer drought-tolerant seeds and shorter-duration crops.",
            "seeds": [
                {"name": "Pearl Millet (Bajra)", "fit": "Strong drought tolerance and low water demand."},
                {"name": "Sorghum (Jowar)", "fit": "Performs well under heat and moisture stress."},
                {"name": "Pigeon Pea (Arhar)", "fit": "Deep roots help sustain growth in dry spells."},
            ],
        }
    if moisture < 0.60:
        return {
            "risk_band": "medium",
            "advisory": "Soil moisture is moderate. Use balanced varieties with irrigation backup.",
            "seeds": [
                {"name": "Maize", "fit": "Good performance with moderate moisture and managed irrigation."},
                {"name": "Groundnut", "fit": "Works well in moderate moisture, avoid waterlogging."},
                {"name": "Soybean", "fit": "Suitable for medium moisture with well-drained soil."},
            ],
        }
    return {
        "risk_band": "low",
        "advisory": "Soil is adequately wet. Choose moisture-loving crops and monitor drainage.",
        "seeds": [
            {"name": "Paddy (Rice)", "fit": "Best suited for high moisture conditions."},
            {"name": "Jute", "fit": "Favors warm and moist soil profiles."},
            {"name": "Colocasia (Arbi)", "fit": "Performs better in consistently moist fields."},
        ],
    }


def build_seed_guidance_for_moisture_index(moisture_index: float, source: str = "rule_based_soil_moisture") -> Dict:
    moisture_ratio = _clamp(moisture_index)
    moisture_percent = round(moisture_ratio * 100.0, 1)
    guidance = _build_seed_suggestions(moisture_percent)
    return {
        "source": source,
        "as_of": _yyyymmdd(date.today()),
        "gwetroot": round(moisture_ratio, 4),
        "soil_moisture_percent": moisture_percent,
        "risk_band": guidance["risk_band"],
        "advisory": guidance["advisory"],
        "seed_suggestions": guidance["seeds"],
    }


def get_nasa_power_soil_moisture(latitude: float, longitude: float) -> Optional[Dict]:
    """Fetch latest GWETROOT for location and derive seed recommendations."""
    settings = get_settings()
    end_date = date.today()
    start_date = end_date - timedelta(days=max(1, settings.nasa_power_days) - 1)

    query = urlencode(
        {
            "parameters": "GWETROOT",
            "community": "AG",
            "longitude": f"{longitude:.4f}",
            "latitude": f"{latitude:.4f}",
            "start": _yyyymmdd(start_date),
            "end": _yyyymmdd(end_date),
            "format": "JSON",
        }
    )
    url = f"{settings.nasa_power_base_url}?{query}"

    try:
        payload = _request_json(url)
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return None

    series = payload.get("properties", {}).get("parameter", {}).get("GWETROOT", {})
    if not isinstance(series, dict) or not series:
        return None

    valid_rows: List[tuple[str, float]] = []
    for key, value in series.items():
        parsed = _to_float(value, -1.0)
        if parsed >= 0.0:
            valid_rows.append((str(key), _clamp(parsed)))

    if not valid_rows:
        return None

    valid_rows.sort(key=lambda item: item[0])
    as_of, moisture_ratio = valid_rows[-1]
    response = build_seed_guidance_for_moisture_index(moisture_ratio, source="nasa_power_gwetroot")
    response["as_of"] = as_of
    return response
