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

CREATE INDEX IF NOT EXISTS idx_risk_predictions_region_date ON risk_predictions(region_id, prediction_date DESC);

