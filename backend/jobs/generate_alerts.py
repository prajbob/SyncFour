"""Alert trigger job."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.config import get_settings
from backend.services.alert_service import generate_alerts


def run() -> dict:
    settings = get_settings()
    processed_dir = Path(settings.processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)

    alerts = generate_alerts()
    output_path = processed_dir / "alerts_generated.json"
    output_path.write_text(json.dumps({"alerts": alerts}, indent=2), encoding="utf-8")
    return {"status": "ok", "output_file": str(output_path), "records_processed": len(alerts)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
