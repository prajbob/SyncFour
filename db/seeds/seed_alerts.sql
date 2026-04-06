INSERT INTO alerts (id, region_id, alert_type, severity, message, status, created_at)
VALUES
    (
        1,
        4,
        'drought_risk',
        'critical',
        'Rajasthan East drought index crossed 0.85 and yield stress is increasing.',
        'active',
        '2026-04-05 09:20:00'
    ),
    (
        2,
        5,
        'flood_risk',
        'high',
        'Bihar North flood probability crossed 0.70 for the next forecast window.',
        'active',
        '2026-04-05 09:45:00'
    ),
    (
        3,
        1,
        'route_disruption',
        'high',
        'Primary Punjab to Rajasthan corridor is blocked. Use alternate lanes.',
        'active',
        '2026-04-05 10:15:00'
    )
ON CONFLICT (id) DO NOTHING;

