from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class PipelineType(str, enum.Enum):
    """Pipeline type."""
    TRAINING = "training"
    EVALUATION = "evaluation"
    BATCH_INFERENCE = "batch_inference"
    FEATURE_ENGINEERING = "feature_engineering"


class PipelineStatus(str, enum.Enum):
    """Pipeline status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepStatus(str, enum.Enum):
    """Pipeline step status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    CHECKPOINTED = "checkpointed"


class Pipeline(Base):
    """ML Pipeline definition."""
    __tablename__ = "pipelines"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    type = Column(Enum(PipelineType), nullable=False)
    
    # Configuration
    steps = Column(JSON, nullable=False)  # List of step definitions
    schedule = Column(String)  # Cron expression
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="pipelines")
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete-orphan")


class PipelineRun(Base):
    """Pipeline execution run."""
    __tablename__ = "pipeline_runs"
    
    id = Column(String, primary_key=True, index=True)
    pipeline_id = Column(String, ForeignKey("pipelines.id"), nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    
    status = Column(Enum(PipelineStatus), default=PipelineStatus.PENDING, index=True)
    steps = Column(JSON, default=list)  # List of step executions
    
    # Timing
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    duration = Column(Float)
    
    # Trigger
    triggered_by = Column(String, nullable=False)  # manual, scheduled, webhook, retrain
    
    # Results
    artifacts = Column(JSON, default=list)
    model_id = Column(String)
    metrics = Column(JSON, default=dict)
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="runs")
