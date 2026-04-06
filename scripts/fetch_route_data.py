"""Download or build the supply route graph inputs."""

from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path


def run() -> dict:
    source = Path("data/external/routes_source.csv")
    fallback = Path("data/sample/sample_routes.csv")
    target = Path("data/raw/routes/routes_data.csv")
    target.parent.mkdir(parents=True, exist_ok=True)

    chosen = source if source.exists() else fallback
    shutil.copyfile(chosen, target)

    with target.open("r", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    return {"status": "ok", "source": str(chosen), "output": str(target), "records": len(rows)}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

