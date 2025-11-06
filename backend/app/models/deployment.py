from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class DeploymentEnvironment(str, enum.Enum):
    """Deployment environment."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DeploymentStrategy(str, enum.Enum):
    """Deployment strategy."""
    ROLLING = "rolling"
    BLUE_GREEN = "blue_green"
    CANARY = "canary"
    SHADOW = "shadow"


class DeploymentStatus(str, enum.Enum):
    """Deployment status."""
    PENDING = "pending"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    FAILED = "failed"
    ROLLEDBACK = "rolledback"
    ARCHIVED = "archived"


class Deployment(Base):
    """Model deployment configuration."""
    __tablename__ = "deployments"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    model_id = Column(String, nullable=False, index=True)
    model_version = Column(String, nullable=False)
    
    name = Column(String, nullable=False)
    environment = Column(Enum(DeploymentEnvironment), nullable=False, index=True)
    strategy = Column(Enum(DeploymentStrategy), nullable=False)
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.PENDING, index=True)
    
    # Configuration
    zones = Column(JSON, default=list)  # List of zone configurations
    server_config = Column(JSON, nullable=False)
    rollback_config = Column(JSON)
    
    # Metrics
    endpoint = Column(String)
    qps = Column(Float)
    latency_p50 = Column(Float)
    latency_p99 = Column(Float)
    error_rate = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    deployed_at = Column(DateTime)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="deployments")


class DeploymentHistory(Base):
    """Deployment change history."""
    __tablename__ = "deployment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(String, nullable=False, index=True)
    
    action = Column(String, nullable=False)  # created, updated, rolledback, scaled, deleted
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user = Column(String, nullable=False)
    details = Column(String)
    from_version = Column(String)
    to_version = Column(String)
