from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.project import ProjectTier, ProjectStatus


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    tier: ProjectTier
    owner: str
    team: str
    business_unit: str
    tags: List[str] = []


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tier: Optional[ProjectTier] = None
    status: Optional[ProjectStatus] = None
    owner: Optional[str] = None
    team: Optional[str] = None
    business_unit: Optional[str] = None
    tags: Optional[List[str]] = None


class Project(ProjectBase):
    """Full project schema."""
    id: str
    status: ProjectStatus
    model_count: int
    pipeline_count: int
    model_excellence_score: Optional[float] = None
    last_deployment: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class ProjectList(BaseModel):
    """List of projects."""
    projects: List[Project]
    total: int
    page: int
    page_size: int


class ProjectStats(BaseModel):
    """Project statistics."""
    project_id: str
    total_runs: int
    success_rate: float
    avg_training_time: float
    active_models: int
    failed_runs: int
    calculated_at: datetime
    
    model_config = {"from_attributes": True}
