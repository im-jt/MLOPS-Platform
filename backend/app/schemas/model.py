from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.model import ModelFramework, ModelType, ModelStatus


class ModelBase(BaseModel):
    """Base model schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: ModelType
    framework: ModelFramework


class ModelCreate(ModelBase):
    """Schema for creating a model."""
    project_id: str


class ModelUpdate(BaseModel):
    """Schema for updating a model."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_production: Optional[bool] = None


class Model(ModelBase):
    """Full model schema."""
    id: str
    project_id: str
    latest_version: Optional[str] = None
    is_production: bool
    deployment_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: str
    
    model_config = {"from_attributes": True}


class ModelVersionBase(BaseModel):
    """Base model version schema."""
    version: str
    framework: ModelFramework
    framework_version: Optional[str] = None
    metrics: Dict[str, float] = {}
    hyperparameters: Dict[str, Any] = {}


class ModelVersionCreate(ModelVersionBase):
    """Schema for creating a model version."""
    model_id: str
    pipeline_run_id: Optional[str] = None
    dataset_id: Optional[str] = None
    dataset_version: Optional[str] = None


class ModelVersion(ModelVersionBase):
    """Full model version schema."""
    id: int
    model_id: str
    status: ModelStatus
    feature_importance: Optional[Dict[str, float]] = None
    training_start_time: Optional[datetime] = None
    training_end_time: Optional[datetime] = None
    training_duration: Optional[float] = None
    model_path: Optional[str] = None
    artifact_uri: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None
    created_at: datetime
    created_by: str
    
    model_config = {"from_attributes": True}


class ModelList(BaseModel):
    """List of models."""
    models: List[Model]
    total: int
    page: int
    page_size: int


class ModelComparison(BaseModel):
    """Model comparison result."""
    models: List[ModelVersion]
    metric_names: List[str]
    winner: Optional[str] = None
