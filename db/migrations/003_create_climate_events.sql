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

CREATE INDEX IF NOT EXISTS idx_climate_events_region_date ON climate_events(region_id, date DESC);

