from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import uuid

from app.db.base import get_db
from app.models.project import Project, ProjectStats, ProjectTier
from app.models.user import User
from app.schemas.project import (
    Project as ProjectSchema,
    ProjectCreate,
    ProjectUpdate,
    ProjectList,
    ProjectStats as ProjectStatsSchema,
)
from app.utils.auth import get_current_user, require_permission, check_user_permission

router = APIRouter()


@router.get("/", response_model=ProjectList)
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tier: Optional[ProjectTier] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects with optional filtering."""
    query = select(Project)
    
    # Non-superusers can only see their own projects unless they have permission
    if not current_user.is_superuser and not check_user_permission(current_user, "project", "read_all"):
        query = query.where(Project.owner_id == current_user.id)
    
    if tier:
        query = query.where(Project.tier == tier)
    
    if search:
        query = query.where(
            (Project.name.ilike(f"%{search}%")) |
            (Project.team.ilike(f"%{search}%"))
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Project.updated_at.desc())
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return ProjectList(
        projects=[ProjectSchema.model_validate(p) for p in projects],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.post("/", response_model=ProjectSchema, status_code=201)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("project", "create")),
):
    """Create a new project."""
    project_data = project.model_dump()
    # Set the owner to the current user if not specified
    if "owner_id" not in project_data or project_data["owner_id"] is None:
        project_data["owner_id"] = current_user.id
    
    db_project = Project(
        id=f"proj-{uuid.uuid4().hex[:12]}",
        **project_data,
        model_count=0,
        pipeline_count=0,
    )
    
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    
    return ProjectSchema.model_validate(db_project)


@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific project by ID."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has permission to view this project
    if not current_user.is_superuser and project.owner_id != current_user.id:
        if not check_user_permission(current_user, "project", "read_all"):
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return ProjectSchema.model_validate(project)


@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has permission to update this project
    if not current_user.is_superuser and project.owner_id != current_user.id:
        if not check_user_permission(current_user, "project", "update"):
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    return ProjectSchema.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only superusers or project owners with delete permission can delete
    if not current_user.is_superuser:
        if project.owner_id != current_user.id or not check_user_permission(current_user, "project", "delete"):
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    await db.delete(project)
    await db.commit()
    
    return None


@router.get("/{project_id}/stats", response_model=ProjectStatsSchema)
async def get_project_stats(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project statistics."""
    # Check if project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has permission to view this project
    if not current_user.is_superuser and project.owner_id != current_user.id:
        if not check_user_permission(current_user, "project", "read_all"):
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get or create stats
    stats_result = await db.execute(
        select(ProjectStats).where(ProjectStats.project_id == project_id)
    )
    stats = stats_result.scalar_one_or_none()
    
    if not stats:
        # Create default stats
        stats = ProjectStats(
            project_id=project_id,
            total_runs=0,
            success_rate=0.0,
            avg_training_time=0.0,
            active_models=0,
            failed_runs=0,
        )
        db.add(stats)
        await db.commit()
        await db.refresh(stats)
    
    return ProjectStatsSchema.model_validate(stats)
