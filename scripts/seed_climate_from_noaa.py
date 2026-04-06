"""Generate db/seeds/seed_climate.sql from current sample_climate.json."""

from __future__ import annotations

import json
from pathlib import Path


def _as_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def run() -> dict:
    sample_path = Path("data/sample/sample_climate.json")
    sql_path = Path("db/seeds/seed_climate.sql")
    if not sample_path.exists():
        raise FileNotFoundError("data/sample/sample_climate.json not found")

    rows = json.loads(sample_path.read_text(encoding="utf-8"))
    values = []
    for row in rows:
        region_id = int(row.get("region_id", 0))
        date_value = str(row.get("date", "")).split("T")[0] or "2026-01-01"
        rainfall = _as_float(row.get("rainfall"), 0.0)
        temperature = _as_float(row.get("temperature"), 0.0)
        drought_index = _as_float(row.get("drought_index"), 0.0)
        flood_probability = _as_float(row.get("flood_probability"), 0.0)
        temperature_anomaly = _as_float(row.get("temperature_anomaly"), 0.0)
        values.append(
            f"    ({region_id}, '{date_value}', {rainfall:.3f}, {temperature:.3f}, {drought_index:.4f}, {flood_probability:.4f}, {temperature_anomaly:.3f})"
        )

    statement_lines = [
        "-- Generated from NOAA-derived sample climate data.",
        "INSERT INTO climate_events (",
        "    region_id,",
        "    date,",
        "    rainfall,",
        "    temperature,",
        "    drought_index,",
        "    flood_probability,",
        "    temperature_anomaly",
        ")",
        "VALUES",
        ",\n".join(values) + ";",
        "",
    ]
    sql_path.write_text("\n".join(statement_lines), encoding="utf-8")
    return {"status": "ok", "sql_output": str(sql_path), "records": len(values)}


if __name__ == "__main__":
    import json as _json

    print(_json.dumps(run(), indent=2))

