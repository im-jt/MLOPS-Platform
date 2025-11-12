from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class RoleBase(BaseModel):
    """Base role schema."""
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a role."""
    permission_ids: Optional[List[str]] = None


class RoleUpdate(BaseModel):
    """Schema for updating a role."""
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class PermissionBase(BaseModel):
    """Base permission schema."""
    name: str
    resource: str
    action: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    """Schema for creating a permission."""
    pass


class Permission(BaseModel):
    """Permission schema."""
    id: str
    name: str
    resource: str
    action: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Role(BaseModel):
    """Role schema."""
    id: str
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[Permission] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class User(BaseModel):
    """User schema."""
    id: str
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    roles: List[Role] = []
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str = "bearer"
    user: User


class UserRoleAssign(BaseModel):
    """Schema for assigning roles to a user."""
    role_ids: List[str]
