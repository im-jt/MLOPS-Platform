from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
import uuid

from app.db.base import get_db
from app.core.security import get_current_active_user, get_user_permissions
from app.models.user import User
from app.models.project import Project, ProjectStats, ProjectTier
from app.schemas.project import (
    Project as ProjectSchema,
    ProjectCreate,
    ProjectUpdate,
    ProjectList,
    ProjectStats as ProjectStatsSchema,
)

router = APIRouter()


@router.get("/", response_model=ProjectList)
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tier: Optional[ProjectTier] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all projects with optional filtering."""
    permissions = await get_user_permissions(current_user, db)
    
    # Check if user has project:read permission or is superuser
    if "*" not in permissions and "project:read" not in permissions:
        # Users can only see their own projects
        query = select(Project).where(
            or_(
                Project.owner == current_user.username,
                Project.owner == current_user.email
            )
        )
    else:
        # Admins and users with project:read can see all projects
        query = select(Project)
    
    if tier:
        query = query.where(Project.tier == tier)
    
    if search:
        query = query.where(
            (Project.name.ilike(f"%{search}%")) |
            (Project.owner.ilike(f"%{search}%")) |
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
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project."""
    permissions = await get_user_permissions(current_user, db)
    
    # Check if user has project:create permission
    if "*" not in permissions and "project:create" not in permissions:
        raise HTTPException(
            status_code=403,
            detail="Permission denied: project:create required"
        )
    
    project_data = project.model_dump()
    # Set owner to current user if not specified or if user doesn't have permission to set owner
    if "owner" not in project_data or ("*" not in permissions and "project:manage" not in permissions):
        project_data["owner"] = current_user.username
    
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
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project by ID."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    permissions = await get_user_permissions(current_user, db)
    
    # Check if user has project:read permission or is owner
    if "*" not in permissions and "project:read" not in permissions:
        if project.owner != current_user.username and project.owner != current_user.email:
            raise HTTPException(
                status_code=403,
                detail="Permission denied: You can only view your own projects"
            )
    
    return ProjectSchema.model_validate(project)


@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    permissions = await get_user_permissions(current_user, db)
    
    # Check if user has project:update permission or is owner
    if "*" not in permissions and "project:update" not in permissions:
        if project.owner != current_user.username and project.owner != current_user.email:
            raise HTTPException(
                status_code=403,
                detail="Permission denied: You can only update your own projects"
            )
    
    update_data = project_update.model_dump(exclude_unset=True)
    
    # Only admins or users with project:manage can change owner
    if "owner" in update_data:
        if "*" not in permissions and "project:manage" not in permissions:
            del update_data["owner"]
    
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    return ProjectSchema.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    permissions = await get_user_permissions(current_user, db)
    
    # Check if user has project:delete permission or is owner
    if "*" not in permissions and "project:delete" not in permissions:
        if project.owner != current_user.username and project.owner != current_user.email:
            raise HTTPException(
                status_code=403,
                detail="Permission denied: You can only delete your own projects"
            )
    
    await db.delete(project)
    await db.commit()
    
    return None


@router.get("/{project_id}/stats", response_model=ProjectStatsSchema)
async def get_project_stats(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get project statistics."""
    # Check if project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    permissions = await get_user_permissions(current_user, db)
    
    # Check if user has project:read permission or is owner
    if "*" not in permissions and "project:read" not in permissions:
        if project.owner != current_user.username and project.owner != current_user.email:
            raise HTTPException(
                status_code=403,
                detail="Permission denied: You can only view stats for your own projects"
            )
    
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
