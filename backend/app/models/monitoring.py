from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, Boolean, ForeignKey
from datetime import datetime
import enum
from app.db.base import Base


class AlertSeverity(str, enum.Enum):
    """Alert severity levels."""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class AlertType(str, enum.Enum):
    """Alert types."""
    PERFORMANCE_DEGRADATION = "performance_degradation"
    FEATURE_DRIFT = "feature_drift"
    DATA_QUALITY = "data_quality"
    LATENCY = "latency"
    ERROR_RATE = "error_rate"


class ModelMonitoring(Base):
    """Model monitoring and metrics."""
    __tablename__ = "model_monitoring"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, nullable=False, index=True)
    deployment_id = Column(String, nullable=False, index=True)
    
    # Model Excellence Score
    mes_overall_score = Column(Float)
    mes_components = Column(JSON)
    mes_trend = Column(String)  # improving, stable, declining
    mes_last_updated = Column(DateTime)
    
    # Feature monitoring
    feature_monitoring = Column(JSON, default=list)
    
    # Performance metrics
    performance_metrics = Column(JSON, default=list)
    
    # Retraining
    last_retrain_time = Column(DateTime)
    next_scheduled_retrain = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class ModelAlert(Base):
    """Model health alerts."""
    __tablename__ = "model_alerts"
    
    id = Column(String, primary_key=True, index=True)
    model_id = Column(String, nullable=False, index=True)
    deployment_id = Column(String, nullable=False, index=True)
    
    severity = Column(Enum(AlertSeverity), nullable=False, index=True)
    type = Column(Enum(AlertType), nullable=False, index=True)
    message = Column(String, nullable=False)
    
    acknowledged = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class FeatureMonitoring(Base):
    """Feature drift and quality monitoring."""
    __tablename__ = "feature_monitoring"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, nullable=False, index=True)
    feature_name = Column(String, nullable=False, index=True)
    
    data_type = Column(String)
    training_distribution = Column(JSON)
    production_distribution = Column(JSON)
    drift_detected = Column(Boolean, default=False)
    drift_score = Column(Float)
    drift_method = Column(String)  # ks_test, chi_square, wasserstein
    
    last_checked = Column(DateTime, default=datetime.utcnow)
