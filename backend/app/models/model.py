from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class ModelFramework(str, enum.Enum):
    """Model framework enumeration."""
    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    XGBOOST = "xgboost"
    SKLEARN = "sklearn"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    CUSTOM = "custom"


class ModelType(str, enum.Enum):
    """Model type enumeration."""
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    RANKING = "ranking"
    FORECASTING = "forecasting"
    CLUSTERING = "clustering"
    ANOMALY_DETECTION = "anomaly_detection"
    RECOMMENDATION = "recommendation"
    LLM = "llm"
    EMBEDDING = "embedding"


class ModelStatus(str, enum.Enum):
    """Model status enumeration."""
    TRAINING = "training"
    READY = "ready"
    DEPLOYED = "deployed"
    ARCHIVED = "archived"
    FAILED = "failed"


class Model(Base):
    """ML Model registry."""
    __tablename__ = "models"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    type = Column(Enum(ModelType), nullable=False)
    framework = Column(Enum(ModelFramework), nullable=False)
    
    latest_version = Column(String)
    is_production = Column(Boolean, default=False)
    deployment_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner = Column(String, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="models")
    versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")


class ModelVersion(Base):
    """Model version with lineage and metrics."""
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String, ForeignKey("models.id"), nullable=False, index=True)
    version = Column(String, nullable=False, index=True)
    status = Column(Enum(ModelStatus), default=ModelStatus.TRAINING)
    
    # Framework info
    framework = Column(Enum(ModelFramework), nullable=False)
    framework_version = Column(String)
    
    # Metrics
    metrics = Column(JSON, default=dict)
    hyperparameters = Column(JSON, default=dict)
    feature_importance = Column(JSON)
    
    # Lineage
    dataset_id = Column(String)
    dataset_version = Column(String)
    pipeline_id = Column(String)
    pipeline_run_id = Column(String)
    parent_model_id = Column(String)
    
    # Training info
    training_start_time = Column(DateTime)
    training_end_time = Column(DateTime)
    training_duration = Column(Float)
    
    # Artifacts
    model_path = Column(String)
    checkpoint_path = Column(String)
    artifact_uri = Column(String)
    
    # Metadata
    tags = Column(JSON, default=list)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=False)
    
    # Relationships
    model = relationship("Model", back_populates="versions")
