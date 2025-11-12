"""
Initialize RBAC system with default roles and permissions.
Run this script after creating the database tables.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import AsyncSessionLocal
from app.models.user import User, Role, Permission
from app.core.security import get_password_hash
from sqlalchemy import select


# Default permissions for the platform
DEFAULT_PERMISSIONS = [
    # Project permissions
    {"name": "project:read", "resource": "project", "action": "read", "description": "View projects"},
    {"name": "project:create", "resource": "project", "action": "create", "description": "Create projects"},
    {"name": "project:update", "resource": "project", "action": "update", "description": "Update projects"},
    {"name": "project:delete", "resource": "project", "action": "delete", "description": "Delete projects"},
    {"name": "project:manage", "resource": "project", "action": "manage", "description": "Manage all projects"},
    
    # Model permissions
    {"name": "model:read", "resource": "model", "action": "read", "description": "View models"},
    {"name": "model:create", "resource": "model", "action": "create", "description": "Create models"},
    {"name": "model:update", "resource": "model", "action": "update", "description": "Update models"},
    {"name": "model:delete", "resource": "model", "action": "delete", "description": "Delete models"},
    {"name": "model:deploy", "resource": "model", "action": "deploy", "description": "Deploy models"},
    
    # Experiment permissions
    {"name": "experiment:read", "resource": "experiment", "action": "read", "description": "View experiments"},
    {"name": "experiment:create", "resource": "experiment", "action": "create", "description": "Create experiments"},
    {"name": "experiment:run", "resource": "experiment", "action": "run", "description": "Run experiments"},
    
    # Pipeline permissions
    {"name": "pipeline:read", "resource": "pipeline", "action": "read", "description": "View pipelines"},
    {"name": "pipeline:create", "resource": "pipeline", "action": "create", "description": "Create pipelines"},
    {"name": "pipeline:run", "resource": "pipeline", "action": "run", "description": "Run pipelines"},
    
    # Deployment permissions
    {"name": "deployment:read", "resource": "deployment", "action": "read", "description": "View deployments"},
    {"name": "deployment:create", "resource": "deployment", "action": "create", "description": "Create deployments"},
    {"name": "deployment:manage", "resource": "deployment", "action": "manage", "description": "Manage deployments"},
    
    # Monitoring permissions
    {"name": "monitoring:read", "resource": "monitoring", "action": "read", "description": "View monitoring data"},
    {"name": "monitoring:manage", "resource": "monitoring", "action": "manage", "description": "Manage monitoring"},
    
    # GenAI permissions
    {"name": "genai:use", "resource": "genai", "action": "use", "description": "Use GenAI features"},
    {"name": "genai:manage", "resource": "genai", "action": "manage", "description": "Manage GenAI settings"},
    
    # User management permissions
    {"name": "user:read", "resource": "user", "action": "read", "description": "View users"},
    {"name": "user:manage", "resource": "user", "action": "manage", "description": "Manage users"},
    
    # Role management permissions
    {"name": "role:read", "resource": "role", "action": "read", "description": "View roles"},
    {"name": "role:manage", "resource": "role", "action": "manage", "description": "Manage roles"},
]


# Default roles with their permissions
DEFAULT_ROLES = {
    "admin": {
        "description": "Administrator with full access",
        "is_system": True,
        "permissions": ["*"],  # All permissions
    },
    "ml_engineer": {
        "description": "ML Engineer with full ML platform access",
        "is_system": True,
        "permissions": [
            "project:read", "project:create", "project:update", "project:delete",
            "model:read", "model:create", "model:update", "model:delete", "model:deploy",
            "experiment:read", "experiment:create", "experiment:run",
            "pipeline:read", "pipeline:create", "pipeline:run",
            "deployment:read", "deployment:create", "deployment:manage",
            "monitoring:read", "monitoring:manage",
            "genai:use", "genai:manage",
        ],
    },
    "data_scientist": {
        "description": "Data Scientist with experiment and model access",
        "is_system": True,
        "permissions": [
            "project:read", "project:create", "project:update",
            "model:read", "model:create", "model:update",
            "experiment:read", "experiment:create", "experiment:run",
            "pipeline:read", "pipeline:create", "pipeline:run",
            "deployment:read",
            "monitoring:read",
            "genai:use",
        ],
    },
    "viewer": {
        "description": "Viewer with read-only access",
        "is_system": True,
        "permissions": [
            "project:read",
            "model:read",
            "experiment:read",
            "pipeline:read",
            "deployment:read",
            "monitoring:read",
        ],
    },
}


async def init_permissions(db: AsyncSession):
    """Initialize default permissions."""
    print("Initializing permissions...")
    
    for perm_data in DEFAULT_PERMISSIONS:
        result = await db.execute(
            select(Permission).where(Permission.name == perm_data["name"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            permission = Permission(
                id=f"perm-{perm_data['name'].replace(':', '-')}",
                **perm_data,
            )
            db.add(permission)
            print(f"  Created permission: {perm_data['name']}")
        else:
            print(f"  Permission already exists: {perm_data['name']}")
    
    await db.commit()


async def init_roles(db: AsyncSession):
    """Initialize default roles."""
    print("Initializing roles...")
    
    for role_name, role_data in DEFAULT_ROLES.items():
        result = await db.execute(select(Role).where(Role.name == role_name))
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"  Role already exists: {role_name}")
            continue
        
        role = Role(
            id=f"role-{role_name}",
            name=role_name,
            description=role_data["description"],
            is_system=role_data["is_system"],
        )
        
        # Assign permissions
        if "*" in role_data["permissions"]:
            # Admin role gets all permissions
            result = await db.execute(select(Permission))
            role.permissions = result.scalars().all()
        else:
            result = await db.execute(
                select(Permission).where(Permission.name.in_(role_data["permissions"]))
            )
            role.permissions = result.scalars().all()
        
        db.add(role)
        print(f"  Created role: {role_name} with {len(role.permissions)} permissions")
    
    await db.commit()


async def create_admin_user(db: AsyncSession, email: str = "admin@example.com", password: str = "admin123"):
    """Create a default admin user."""
    print("Creating admin user...")
    
    result = await db.execute(select(User).where(User.email == email))
    existing = await db.scalar(result)
    
    if existing:
        print(f"  Admin user already exists: {email}")
        return
    
    # Get admin role
    result = await db.execute(select(Role).where(Role.name == "admin"))
    admin_role = result.scalar_one_or_none()
    
    if not admin_role:
        print("  ERROR: Admin role not found. Please run init_roles first.")
        return
    
    admin_user = User(
        id="user-admin",
        email=email,
        username="admin",
        full_name="Administrator",
        hashed_password=get_password_hash(password),
        is_active=True,
        is_superuser=True,
    )
    admin_user.roles = [admin_role]
    
    db.add(admin_user)
    await db.commit()
    print(f"  Created admin user: {email} (password: {password})")


async def main():
    """Main initialization function."""
    print("=" * 60)
    print("RBAC Initialization Script")
    print("=" * 60)
    
    async with AsyncSessionLocal() as db:
        try:
            await init_permissions(db)
            await init_roles(db)
            await create_admin_user(db)
            print("\n" + "=" * 60)
            print("RBAC initialization completed successfully!")
            print("=" * 60)
        except Exception as e:
            print(f"\nERROR: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
