CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES alerts(id),
    recommendation_text TEXT NOT NULL,
    priority TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

