# API Specification

Base URL: `http://localhost:8000`

## Health
- `GET /healthz`
- Returns service status and environment.

## Dashboard
- `GET /api/dashboard/summary`
- Returns top risk regions, active alerts, system metrics, and risk distribution.

- `GET /api/dashboard/map-data`
- Returns GeoJSON `FeatureCollection` for risk map rendering.

## Regions
- `GET /api/regions?search=&risk_level=&sort_by=&order=`
- Returns filtered/sorted region list with risk scores.

- `GET /api/regions/{region_id}`
- Returns detailed region view:
  - prediction
  - climate summary/history
  - crop patterns and stress
  - route list
  - alert history
  - recommended actions

## Climate
- `GET /api/climate/{region_id}`
- Returns climate history and aggregate summary for region.

## Routes
- `GET /api/routes/{route_id}`
- Returns route status, disruption risk, and alternate route IDs.

## Predictions
- `POST /api/predict/risk`
- Request:
```json
{
  "region_id": 4,
  "crop_id": 1,
  "forecast_horizon_days": 14,
  "override_signals": {
    "drought_index": 0.9
  }
}
```
- Response includes shortage risk, disruption risk, combined score, level, confidence, explanation, and recommended action.

## Alerts
- `GET /api/alerts?status=active`
- Returns active or historical alerts.

- `POST /api/alerts/generate`
- Triggers alert generation from current risk conditions.

- `POST /api/alerts/subscribe`
- Stores user watchlist and notification channels.

- `POST /api/alerts/test?region_id=1`
- Creates a manual test alert for a region.

- `PATCH /api/alerts/{alert_id}?status=resolved`
- Updates alert status.

