from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class ExperimentStatus(str, enum.Enum):
    """Experiment status."""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"


class Experiment(Base):
    """Experiment tracking."""
    __tablename__ = "experiments"
    
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    
    pipeline_run_id = Column(String, index=True)
    status = Column(Enum(ExperimentStatus), default=ExperimentStatus.RUNNING, index=True)
    
    # Configuration
    parameters = Column(JSON, default=list)
    metrics = Column(JSON, default=list)
    artifacts = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    
    # Timing
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    duration = Column(Float)
    
    # Metadata
    created_by = Column(String, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="experiments")
    runs = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan")


class ExperimentRun(Base):
    """Individual experiment run."""
    __tablename__ = "experiment_runs"
    
    id = Column(String, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False, index=True)
    run_number = Column(Integer, nullable=False)
    status = Column(Enum(ExperimentStatus), default=ExperimentStatus.RUNNING)
    
    parameters = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict)
    
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    
    # Relationships
    experiment = relationship("Experiment", back_populates="runs")
