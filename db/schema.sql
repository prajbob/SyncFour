-- Main PostgreSQL/PostGIS schema for Climate-Crop-Supply Intelligence Platform

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    geometry GEOMETRY(Geometry, 4326),
    priority_level INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS crops (
    id SERIAL PRIMARY KEY,
    crop_name TEXT NOT NULL,
    category TEXT,
    season TEXT,
    sensitivity_score DECIMAL(5, 4) NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS climate_events (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id),
    date DATE NOT NULL,
    rainfall DECIMAL(10, 3),
    temperature DECIMAL(10, 3),
    drought_index DECIMAL(5, 4),
    flood_probability DECIMAL(5, 4),
    temperature_anomaly DECIMAL(6, 3)
);

CREATE TABLE IF NOT EXISTS crop_patterns (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id),
    crop_id INTEGER NOT NULL REFERENCES crops(id),
    season TEXT,
    yield_history JSONB,
    planting_cycle JSONB
);

CREATE TABLE IF NOT EXISTS supply_routes (
    id SERIAL PRIMARY KEY,
    from_region_id INTEGER NOT NULL REFERENCES regions(id),
    to_region_id INTEGER NOT NULL REFERENCES regions(id),
    route_type TEXT NOT NULL,
    distance_km DECIMAL(10, 3),
    travel_time_hr DECIMAL(10, 3),
    route_status TEXT NOT NULL DEFAULT 'open',
    disruption_risk DECIMAL(5, 4) NOT NULL DEFAULT 0.2
);

CREATE TABLE IF NOT EXISTS risk_predictions (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id),
    crop_id INTEGER REFERENCES crops(id),
    prediction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    shortage_risk DECIMAL(5, 4) NOT NULL,
    disruption_risk DECIMAL(5, 4) NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    risk_level TEXT NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES alerts(id),
    recommendation_text TEXT NOT NULL,
    priority TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_priority_level ON regions(priority_level);
CREATE INDEX IF NOT EXISTS idx_climate_events_region_date ON climate_events(region_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_patterns_region_crop ON crop_patterns(region_id, crop_id);
CREATE INDEX IF NOT EXISTS idx_supply_routes_from_to ON supply_routes(from_region_id, to_region_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_region_date ON risk_predictions(region_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_region_created ON alerts(region_id, created_at DESC);

