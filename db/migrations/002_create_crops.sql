CREATE TABLE IF NOT EXISTS crops (
    id SERIAL PRIMARY KEY,
    crop_name TEXT NOT NULL,
    category TEXT,
    season TEXT,
    sensitivity_score DECIMAL(5, 4) NOT NULL DEFAULT 0.5
);

