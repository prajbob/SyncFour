"""FastAPI backend entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import get_settings
from backend.routes.alerts import router as alerts_router
from backend.routes.climate import router as climate_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.location import router as location_router
from backend.routes.predictions import router as predictions_router
from backend.routes.regions import router as regions_router
from backend.routes.routes import router as routes_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Climate-Crop-Supply Intelligence API",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz", tags=["health"])
    def health_check() -> dict:
        return {"status": "ok", "environment": settings.environment}

    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
    app.include_router(location_router, prefix="/api/location", tags=["location"])
    app.include_router(regions_router, prefix="/api/regions", tags=["regions"])
    app.include_router(climate_router, prefix="/api/climate", tags=["climate"])
    app.include_router(routes_router, prefix="/api/routes", tags=["routes"])
    app.include_router(predictions_router, prefix="/api/predict", tags=["predictions"])
    app.include_router(alerts_router, prefix="/api/alerts", tags=["alerts"])

    return app


app = create_app()
