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

CREATE INDEX IF NOT EXISTS idx_supply_routes_from_to ON supply_routes(from_region_id, to_region_id);

