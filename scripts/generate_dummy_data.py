"""Create realistic dummy data variants for demo mode."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path


def run(seed: int = 42, overwrite: bool = False) -> dict:
    random.seed(seed)
    sample_path = Path("data/sample/sample_climate.json")
    output_path = Path("data/sample/generated_climate_dummy.json")

    if output_path.exists() and not overwrite:
        rows = json.loads(output_path.read_text(encoding="utf-8"))
        return {"status": "skipped", "reason": "file exists", "output": str(output_path), "records": len(rows)}

    rows = json.loads(sample_path.read_text(encoding="utf-8"))
    generated = []
    for row in rows:
        jitter = random.uniform(-0.08, 0.08)
        generated.append(
            {
                **row,
                "rainfall": round(max(0.0, row["rainfall"] * (1 + jitter)), 2),
                "temperature": round(row["temperature"] + random.uniform(-0.6, 0.6), 2),
                "drought_index": round(min(1.0, max(0.0, row["drought_index"] + random.uniform(-0.05, 0.05))), 3),
                "flood_probability": round(
                    min(1.0, max(0.0, row["flood_probability"] + random.uniform(-0.06, 0.06))), 3
                ),
            }
        )
    output_path.write_text(json.dumps(generated, indent=2), encoding="utf-8")
    return {"status": "ok", "output": str(output_path), "records": len(generated)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate dummy climate data.")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(seed=args.seed, overwrite=args.overwrite), indent=2))

