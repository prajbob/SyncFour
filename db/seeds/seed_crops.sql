INSERT INTO crops (id, crop_name, category, season, sensitivity_score)
VALUES
    (1, 'Wheat', 'cereal', 'rabi', 0.62),
    (2, 'Rice', 'cereal', 'kharif', 0.74),
    (3, 'Maize', 'cereal', 'kharif', 0.58)
ON CONFLICT (id) DO NOTHING;

