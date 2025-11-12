from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime, timedelta

from app.db.base import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user,
    get_user_permissions,
)
from app.models.user import User, Role, Permission
from app.schemas.user import (
    User as UserSchema,
    UserCreate,
    UserUpdate,
    UserLogin,
    Token,
    Role as RoleSchema,
    RoleCreate,
    RoleUpdate,
    Permission as PermissionSchema,
    PermissionCreate,
    UserRoleAssign,
)

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Login endpoint."""
    # Find user by username or email
    result = await db.execute(
        select(User).where(
            (User.username == form_data.username) | (User.email == form_data.username)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    # Load user roles and permissions
    await db.refresh(user, ["roles"])
    for role in user.roles:
        await db.refresh(role, ["permissions"])
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserSchema.model_validate(user),
    )


@router.post("/register", response_model=UserSchema, status_code=201)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    # Check if user already exists
    result = await db.execute(
        select(User).where(
            (User.email == user_data.email) | (User.username == user_data.username)
        )
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create new user
    user = User(
        id=f"user-{uuid.uuid4().hex[:12]}",
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        is_active=True,
        is_superuser=False,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserSchema.model_validate(user)


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information."""
    await db.refresh(current_user, ["roles"])
    for role in current_user.roles:
        await db.refresh(role, ["permissions"])
    
    return UserSchema.model_validate(current_user)


@router.get("/me/permissions", response_model=List[str])
async def get_my_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's permissions."""
    permissions = await get_user_permissions(current_user, db)
    return list(permissions)


# User Management Endpoints (Admin only)
@router.get("/users", response_model=List[UserSchema])
async def list_users(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    for user in users:
        await db.refresh(user, ["roles"])
        for role in user.roles:
            await db.refresh(role, ["permissions"])
    
    return [UserSchema.model_validate(user) for user in users]


@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user (admin only or own profile)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Users can view their own profile, admins can view any
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    await db.refresh(user, ["roles"])
    for role in user.roles:
        await db.refresh(role, ["permissions"])
    
    return UserSchema.model_validate(user)


@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user (admin only or own profile)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Users can update their own profile (except is_superuser), admins can update any
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Non-admins cannot change is_superuser or is_active
    if not current_user.is_superuser:
        user_update.is_superuser = None
        if user_id != current_user.id:
            user_update.is_active = None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user, ["roles"])
    for role in user.roles:
        await db.refresh(role, ["permissions"])
    
    return UserSchema.model_validate(user)


# Role Management Endpoints
@router.get("/roles", response_model=List[RoleSchema])
async def list_roles(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all roles."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(Role))
    roles = result.scalars().all()
    
    for role in roles:
        await db.refresh(role, ["permissions"])
    
    return [RoleSchema.model_validate(role) for role in roles]


@router.post("/roles", response_model=RoleSchema, status_code=201)
async def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new role (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Check if role already exists
    result = await db.execute(select(Role).where(Role.name == role_data.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role already exists"
        )
    
    role = Role(
        id=f"role-{uuid.uuid4().hex[:12]}",
        name=role_data.name,
        description=role_data.description,
        is_system=False,
    )
    
    # Assign permissions if provided
    if role_data.permission_ids:
        result = await db.execute(
            select(Permission).where(Permission.id.in_(role_data.permission_ids))
        )
        role.permissions = result.scalars().all()
    
    db.add(role)
    await db.commit()
    await db.refresh(role, ["permissions"])
    
    return RoleSchema.model_validate(role)


@router.put("/roles/{role_id}", response_model=RoleSchema)
async def update_role(
    role_id: str,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a role (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify system roles"
        )
    
    update_data = role_update.model_dump(exclude_unset=True)
    permission_ids = update_data.pop("permission_ids", None)
    
    for field, value in update_data.items():
        if value is not None:
            setattr(role, field, value)
    
    if permission_ids is not None:
        result = await db.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        role.permissions = result.scalars().all()
    
    await db.commit()
    await db.refresh(role, ["permissions"])
    
    return RoleSchema.model_validate(role)


@router.post("/users/{user_id}/roles", response_model=UserSchema)
async def assign_roles_to_user(
    user_id: str,
    role_assign: UserRoleAssign,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign roles to a user (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.execute(
        select(Role).where(Role.id.in_(role_assign.role_ids))
    )
    roles = result.scalars().all()
    
    user.roles = roles
    await db.commit()
    await db.refresh(user, ["roles"])
    for role in user.roles:
        await db.refresh(role, ["permissions"])
    
    return UserSchema.model_validate(user)


# Permission Management Endpoints
@router.get("/permissions", response_model=List[PermissionSchema])
async def list_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all permissions."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(Permission))
    permissions = result.scalars().all()
    
    return [PermissionSchema.model_validate(p) for p in permissions]


@router.post("/permissions", response_model=PermissionSchema, status_code=201)
async def create_permission(
    permission_data: PermissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new permission (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Check if permission already exists
    result = await db.execute(
        select(Permission).where(Permission.name == permission_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists"
        )
    
    permission = Permission(
        id=f"perm-{uuid.uuid4().hex[:12]}",
        **permission_data.model_dump(),
    )
    
    db.add(permission)
    await db.commit()
    await db.refresh(permission)
    
    return PermissionSchema.model_validate(permission)
