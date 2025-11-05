from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import uuid

from app.db.base import get_db
from app.models.model import Model, ModelVersion
from app.schemas.model import (
    Model as ModelSchema,
    ModelCreate,
    ModelUpdate,
    ModelList,
    ModelVersion as ModelVersionSchema,
    ModelVersionCreate,
)

router = APIRouter()


@router.get("/", response_model=ModelList)
async def list_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    project_id: Optional[str] = None,
    is_production: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all models with optional filtering."""
    query = select(Model)
    
    if project_id:
        query = query.where(Model.project_id == project_id)
    
    if is_production is not None:
        query = query.where(Model.is_production == is_production)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Model.updated_at.desc())
    result = await db.execute(query)
    models = result.scalars().all()
    
    return ModelList(
        models=[ModelSchema.model_validate(m) for m in models],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.post("/", response_model=ModelSchema, status_code=201)
async def create_model(
    model: ModelCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new model."""
    db_model = Model(
        id=f"model-{uuid.uuid4().hex[:12]}",
        **model.model_dump(),
        deployment_count=0,
        owner="system",  # Should come from auth
    )
    
    db.add(db_model)
    await db.commit()
    await db.refresh(db_model)
    
    return ModelSchema.model_validate(db_model)


@router.get("/{model_id}", response_model=ModelSchema)
async def get_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific model by ID."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return ModelSchema.model_validate(model)


@router.put("/{model_id}", response_model=ModelSchema)
async def update_model(
    model_id: str,
    model_update: ModelUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a model."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    update_data = model_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(model, field, value)
    
    await db.commit()
    await db.refresh(model)
    
    return ModelSchema.model_validate(model)


@router.delete("/{model_id}", status_code=204)
async def delete_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a model."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    await db.delete(model)
    await db.commit()
    
    return None


@router.get("/{model_id}/versions", response_model=List[ModelVersionSchema])
async def list_model_versions(
    model_id: str,
    db: AsyncSession = Depends(get_db),
):
    """List all versions of a model."""
    result = await db.execute(
        select(ModelVersion)
        .where(ModelVersion.model_id == model_id)
        .order_by(ModelVersion.created_at.desc())
    )
    versions = result.scalars().all()
    
    return [ModelVersionSchema.model_validate(v) for v in versions]


@router.post("/{model_id}/versions", response_model=ModelVersionSchema, status_code=201)
async def create_model_version(
    model_id: str,
    version: ModelVersionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new model version."""
    # Check if model exists
    result = await db.execute(select(Model).where(Model.id == model_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Model not found")
    
    db_version = ModelVersion(
        **version.model_dump(),
        created_by="system",  # Should come from auth
    )
    
    db.add(db_version)
    await db.commit()
    await db.refresh(db_version)
    
    # Update model's latest version
    model = await db.get(Model, model_id)
    model.latest_version = version.version
    await db.commit()
    
    return ModelVersionSchema.model_validate(db_version)
