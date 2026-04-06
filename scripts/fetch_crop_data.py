"""Download or load crop datasets for the pipeline."""

from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path


def run() -> dict:
    source = Path("data/external/crops_source.csv")
    fallback = Path("data/sample/sample_crops.csv")
    target = Path("data/raw/crops/crops_data.csv")
    target.parent.mkdir(parents=True, exist_ok=True)

    chosen = source if source.exists() else fallback
    shutil.copyfile(chosen, target)

    with target.open("r", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    return {"status": "ok", "source": str(chosen), "output": str(target), "records": len(rows)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

