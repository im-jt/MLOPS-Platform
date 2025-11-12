from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.base import get_db
from app.models.user import User, Role, Permission
from app.schemas.user import (
    Token, LoginRequest, UserCreate, User as UserSchema,
    UserUpdate, Role as RoleSchema, RoleCreate, RoleUpdate,
    Permission as PermissionSchema, PermissionCreate,
    ChangePasswordRequest
)
from app.utils.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_active_user, get_current_superuser
)

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return access token."""
    # Find user by username or email
    result = await db.execute(
        select(User).where(
            (User.username == credentials.username) | (User.email == credentials.username)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username},
        expires_delta=access_token_expires
    )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information."""
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information."""
    # Users can only update their own non-security related fields
    if user_update.email:
        # Check if email already exists
        result = await db.execute(
            select(User).where(User.email == user_update.email, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
    
    if user_update.username:
        # Check if username already exists
        result = await db.execute(
            select(User).where(User.username == user_update.username, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = user_update.username
    
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
async def change_password(
    password_change: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Change current user's password."""
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = get_password_hash(password_change.new_password)
    await db.commit()
    
    return {"message": "Password updated successfully"}


# User Management Endpoints (Admin only)
@router.post("/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Create a new user (admin only)."""
    # Check if username or email already exists
    result = await db.execute(
        select(User).where(
            (User.username == user_create.username) | (User.email == user_create.email)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create user
    user = User(
        email=user_create.email,
        username=user_create.username,
        full_name=user_create.full_name,
        hashed_password=get_password_hash(user_create.password)
    )
    
    # Add roles
    if user_create.role_ids:
        result = await db.execute(select(Role).where(Role.id.in_(user_create.role_ids)))
        roles = result.scalars().all()
        user.roles = list(roles)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users", response_model=List[UserSchema])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """List all users (admin only)."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()
    return users


@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Get user by ID (admin only)."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Update user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if user_update.email:
        result = await db.execute(
            select(User).where(User.email == user_update.email, User.id != user_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_update.email
    
    if user_update.username:
        result = await db.execute(
            select(User).where(User.username == user_update.username, User.id != user_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        user.username = user_update.username
    
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    
    if user_update.password:
        user.hashed_password = get_password_hash(user_update.password)
    
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    
    if user_update.status:
        user.status = user_update.status
    
    if user_update.role_ids is not None:
        result = await db.execute(select(Role).where(Role.id.in_(user_update.role_ids)))
        roles = result.scalars().all()
        user.roles = list(roles)
    
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Delete user (admin only)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await db.delete(user)
    await db.commit()


# Role Management Endpoints
@router.post("/roles", response_model=RoleSchema, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_create: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Create a new role (admin only)."""
    # Check if role already exists
    result = await db.execute(select(Role).where(Role.name == role_create.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role already exists"
        )
    
    role = Role(
        name=role_create.name,
        description=role_create.description
    )
    
    # Add permissions
    if role_create.permission_ids:
        result = await db.execute(
            select(Permission).where(Permission.id.in_(role_create.permission_ids))
        )
        permissions = result.scalars().all()
        role.permissions = list(permissions)
    
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.get("/roles", response_model=List[RoleSchema])
async def list_roles(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all roles."""
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .offset(skip)
        .limit(limit)
    )
    roles = result.scalars().all()
    return roles


@router.get("/roles/{role_id}", response_model=RoleSchema)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get role by ID."""
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role


@router.put("/roles/{role_id}", response_model=RoleSchema)
async def update_role(
    role_id: int,
    role_update: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Update role (admin only)."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if role_update.name:
        result = await db.execute(
            select(Role).where(Role.name == role_update.name, Role.id != role_id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists"
            )
        role.name = role_update.name
    
    if role_update.description is not None:
        role.description = role_update.description
    
    if role_update.permission_ids is not None:
        result = await db.execute(
            select(Permission).where(Permission.id.in_(role_update.permission_ids))
        )
        permissions = result.scalars().all()
        role.permissions = list(permissions)
    
    await db.commit()
    await db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Delete role (admin only)."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    await db.delete(role)
    await db.commit()


# Permission Management Endpoints
@router.post("/permissions", response_model=PermissionSchema, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_create: PermissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Create a new permission (admin only)."""
    # Check if permission already exists
    result = await db.execute(
        select(Permission).where(Permission.name == permission_create.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists"
        )
    
    permission = Permission(**permission_create.model_dump())
    db.add(permission)
    await db.commit()
    await db.refresh(permission)
    return permission


@router.get("/permissions", response_model=List[PermissionSchema])
async def list_permissions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all permissions."""
    result = await db.execute(
        select(Permission).offset(skip).limit(limit)
    )
    permissions = result.scalars().all()
    return permissions


@router.delete("/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Delete permission (admin only)."""
    result = await db.execute(select(Permission).where(Permission.id == permission_id))
    permission = result.scalar_one_or_none()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    await db.delete(permission)
    await db.commit()
