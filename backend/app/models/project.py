from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class ProjectTier(str, enum.Enum):
    """Project tier enumeration."""
    TIER_1 = "tier-1"
    TIER_2 = "tier-2"
    TIER_3 = "tier-3"
    TIER_4 = "tier-4"


class ProjectStatus(str, enum.Enum):
    """Project status enumeration."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DEVELOPMENT = "development"


class Project(Base):
    """ML Project model."""
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    tier = Column(Enum(ProjectTier), nullable=False, index=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DEVELOPMENT)
    
    # Metadata
    owner = Column(String, nullable=False, index=True)
    team = Column(String, nullable=False, index=True)
    business_unit = Column(String, nullable=False)
    tags = Column(JSON, default=list)
    
    # Metrics
    model_count = Column(Integer, default=0)
    pipeline_count = Column(Integer, default=0)
    model_excellence_score = Column(Float)
    last_deployment = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    models = relationship("Model", back_populates="project", cascade="all, delete-orphan")
    pipelines = relationship("Pipeline", back_populates="project", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="project", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")


class ProjectStats(Base):
    """Project statistics and metrics."""
    __tablename__ = "project_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, nullable=False, index=True)
    
    total_runs = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    avg_training_time = Column(Float, default=0.0)
    active_models = Column(Integer, default=0)
    failed_runs = Column(Integer, default=0)
    
    calculated_at = Column(DateTime, default=datetime.utcnow)
