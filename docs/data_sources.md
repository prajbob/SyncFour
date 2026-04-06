# Data Sources

## Climate
- Live mode: national weather APIs, flood datasets, drought indicators.
- Demo mode fallback: `data/sample/sample_climate.json`.
- Drought/Flood API replacement: `data/sample/sample_drought_flood.json`.

## Crops
- Live mode: government/open crop yield and crop pattern datasets.
- Crop statistics source (kept as requested): repo root `crop_production.csv`.
- Supporting demo crop catalog: `data/sample/sample_crops.csv`.

## Supply Routes
- Live mode: logistics feeds, road status, or transport network APIs.
- Demo mode fallback: `data/sample/sample_routes.csv`.
- Transport network API replacement: `data/sample/sample_transport_network.json`.

## Regional Metadata
- Demo region metadata: `data/sample/sample_regions.csv`.
- Can be replaced with district/state geospatial metadata for expansion.

## Soil, Water, Market, Storage, Satellite, and Social
- Soil API replacement: `data/sample/sample_soil_data.csv`.
- Irrigation/Water API replacement: `data/sample/sample_irrigation_water.json`.
- Market price API replacement: `data/sample/sample_market_prices.csv`.
- Storage API replacement: `data/sample/sample_storage.csv`.
- Satellite imagery API replacement: `data/sample/sample_satellite_imagery.json`.
- Social/news API replacement: `data/sample/sample_social_news.json`.

## Alerts and Recommendations
- Demo baseline alerts: `data/sample/sample_alerts.json`.
- Demo baseline recommendations: `data/sample/sample_recommendations.json`.

## Notes
- The backend defaults to sample data when external APIs are unavailable.
- The pipeline scripts are structured so external connectors can be swapped in without changing API contracts.
