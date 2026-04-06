"""ORM table models aligned with the project schema."""

from __future__ import annotations

from sqlalchemy import JSON, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    country = Column(String(120), nullable=False)
    state = Column(String(120), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geometry = Column(Text, nullable=True)
    priority_level = Column(Integer, default=1)

    climate_events = relationship("ClimateEvent", back_populates="region")
    crop_patterns = relationship("CropPattern", back_populates="region")
    predictions = relationship("RiskPrediction", back_populates="region")
    alerts = relationship("Alert", back_populates="region")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(120), nullable=False)
    category = Column(String(80), nullable=True)
    season = Column(String(80), nullable=True)
    sensitivity_score = Column(Float, default=0.5)

    crop_patterns = relationship("CropPattern", back_populates="crop")
    predictions = relationship("RiskPrediction", back_populates="crop")


class ClimateEvent(Base):
    __tablename__ = "climate_events"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    date = Column(Date, nullable=False)
    rainfall = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    drought_index = Column(Float, nullable=True)
    flood_probability = Column(Float, nullable=True)
    temperature_anomaly = Column(Float, nullable=True)

    region = relationship("Region", back_populates="climate_events")


class CropPattern(Base):
    __tablename__ = "crop_patterns"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    season = Column(String(80), nullable=True)
    yield_history = Column(JSON, nullable=True)
    planting_cycle = Column(JSON, nullable=True)

    region = relationship("Region", back_populates="crop_patterns")
    crop = relationship("Crop", back_populates="crop_patterns")


class SupplyRoute(Base):
    __tablename__ = "supply_routes"

    id = Column(Integer, primary_key=True, index=True)
    from_region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    to_region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    route_type = Column(String(60), nullable=False)
    distance_km = Column(Float, nullable=True)
    travel_time_hr = Column(Float, nullable=True)
    route_status = Column(String(40), default="open")
    disruption_risk = Column(Float, default=0.2)


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)
    prediction_date = Column(DateTime, nullable=False)
    shortage_risk = Column(Float, nullable=False)
    disruption_risk = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)

    region = relationship("Region", back_populates="predictions")
    crop = relationship("Crop", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    alert_type = Column(String(60), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), default="active")
    created_at = Column(DateTime, nullable=False)

    region = relationship("Region", back_populates="alerts")
    recommendations = relationship("Recommendation", back_populates="alert")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False)

    alert = relationship("Alert", back_populates="recommendations")

