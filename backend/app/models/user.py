from sqlalchemy import Column, String, Integer, DateTime, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

# Association tables for many-to-many relationships
user_role = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

role_permission = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    roles = relationship("Role", secondary=user_role, back_populates="users")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class Role(Base):
    """Role model for RBAC."""
    __tablename__ = "roles"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(String)
    is_system = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", secondary=user_role, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permission, back_populates="roles")
    
    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"


class Permission(Base):
    """Permission model for fine-grained access control."""
    __tablename__ = "permissions"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    resource = Column(String, nullable=False, index=True)  # e.g., "project", "model", "deployment"
    action = Column(String, nullable=False, index=True)  # e.g., "create", "read", "update", "delete"
    description = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    roles = relationship("Role", secondary=role_permission, back_populates="permissions")
    
    def __repr__(self):
        return f"<Permission(id={self.id}, name={self.name}, resource={self.resource}, action={self.action})>"
