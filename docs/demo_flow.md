# Demo Flow (Hackathon)

## Storyline
Show how climate anomalies lead to crop stress, then route disruption, and finally shortage risk and alerts.

## Suggested 6-Minute Walkthrough
1. Open dashboard summary.
2. Highlight top-risk regions and explain score composition.
3. Open map layer and show high-risk hotspots.
4. Drill into a region details page:
   - climate history
   - crop stress
   - route status and alternates
5. Trigger prediction API with override signal (simulate worsening drought/flood).
6. Generate alerts and show recommended actions and severity.
7. Close with operational value for government/NGO/retail teams.

## Demo Commands
Run backend:
```bash
uvicorn backend.app.main:app --reload --port 8000
```

Run full local pipeline:
```bash
bash scripts/run_pipeline.sh
```

Run alert generation job only:
```bash
python backend/jobs/generate_alerts.py
```

## Key Messages for Judges
- Predicts risk before shortages become visible.
- Explains *why* a region is risky.
- Recommends concrete actions.
- Works with live data or fallback dummy data.

