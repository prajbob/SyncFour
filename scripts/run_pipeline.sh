#!/usr/bin/env bash
set -euo pipefail

echo "[1/8] Fetching climate data..."
python scripts/fetch_climate_data.py

echo "[1b] Building climate SQL seed from latest climate sample..."
python scripts/seed_climate_from_noaa.py

echo "[2/8] Fetching crop data..."
python scripts/fetch_crop_data.py

echo "[3/8] Fetching route data..."
python scripts/fetch_route_data.py

echo "[4/8] Cleaning data..."
python scripts/clean_data.py

echo "[5/8] Building features..."
python scripts/build_features.py

echo "[6/8] Computing scores..."
python scripts/compute_scores.py

echo "[7/8] Generating alerts..."
python scripts/generate_alerts.py

echo "[8/8] Training optional baseline model..."
python scripts/train_model.py

echo "Pipeline completed successfully."
