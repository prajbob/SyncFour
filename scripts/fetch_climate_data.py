"""Download or load climate observations for the pipeline."""

from __future__ import annotations

import json
import shutil
from pathlib import Path


def run() -> dict:
    source = Path("data/external/climate_source.json")
    fallback = Path("data/sample/sample_climate.json")
    target = Path("data/raw/climate/climate_data.json")
    target.parent.mkdir(parents=True, exist_ok=True)

    chosen = source if source.exists() else fallback
    shutil.copyfile(chosen, target)
    rows = json.loads(target.read_text(encoding="utf-8"))
    return {"status": "ok", "source": str(chosen), "output": str(target), "records": len(rows)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

