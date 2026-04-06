# Climate-Crop-Supply Intelligence Platform Architecture

## Goal
Predict food shortages and delivery disruptions by fusing:
- Climate indicators (drought, flood probability, temperature anomaly)
- Crop vulnerability and yield trends
- Supply route health and redundancy

## Layers
- `frontend/`: Dashboard pages, maps, charts, alerts, and recommendations (already completed).
- `backend/`: FastAPI service, scoring engine, route handlers, and alert logic.
- `db/`: PostgreSQL/PostGIS schema, migrations, and seed data.
- `data/`: Raw, processed, and sample datasets for local demo and fallback mode.
- `scripts/`: End-to-end pipeline for ingestion, cleaning, feature engineering, scoring, and alerts.
- `infra/`: Dockerfiles, nginx reverse proxy config, and deployment helper.

## Main Backend Flow
1. `routes/*` receive API calls.
2. `services/*` orchestrate climate, crop, route, risk, and alert logic.
3. `core/feature_engineering.py` and `core/scoring.py` compute risk signals and levels.
4. Alerts and recommendations are generated from risk outputs.
5. APIs return map-ready and dashboard-ready payloads.

## MVP Scope
- 1 country (India demo data), 5 regions.
- Dummy route graph with route status and disruption risk.
- Core climate anomalies and weighted scoring logic.
- Alert generation with explainable reasons and actions.

