# Database Design

Primary database target: PostgreSQL with PostGIS extension.

## Core Tables
- `regions`
  - Geographic and priority metadata for monitored regions.
- `crops`
  - Crop catalog with season and sensitivity score.
- `climate_events`
  - Daily/periodic climate indicators per region.
- `crop_patterns`
  - Region-crop links with yield history and planting cycles.
- `supply_routes`
  - Transport graph edges, route status, and disruption risk.
- `risk_predictions`
  - Time-stamped model outputs and explanations.
- `alerts`
  - Generated warning events and status lifecycle.
- `recommendations`
  - Action guidance attached to alert records.

## Keys and Relationships
- `climate_events.region_id -> regions.id`
- `crop_patterns.region_id -> regions.id`
- `crop_patterns.crop_id -> crops.id`
- `supply_routes.from_region_id -> regions.id`
- `supply_routes.to_region_id -> regions.id`
- `risk_predictions.region_id -> regions.id`
- `risk_predictions.crop_id -> crops.id`
- `alerts.region_id -> regions.id`
- `recommendations.alert_id -> alerts.id`

## Indexing
- Region priority lookup.
- Climate events by `(region_id, date DESC)`.
- Supply route from/to pairs.
- Risk predictions by `(region_id, prediction_date DESC)`.
- Alerts by `(region_id, created_at DESC)`.

## Migration Order
1. `001_create_regions.sql`
2. `002_create_crops.sql`
3. `003_create_climate_events.sql`
4. `004_create_supply_routes.sql`
5. `005_create_risk_predictions.sql`
6. `006_create_alerts.sql`
7. `007_create_recommendations.sql`

