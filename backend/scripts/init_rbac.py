"""
Initialize RBAC system with default roles and permissions.
Run this script after database migration to set up initial RBAC data.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import AsyncSessionLocal
from app.models.user import User, Role, Permission, UserStatus
from app.utils.auth import get_password_hash


async def init_rbac():
    """Initialize RBAC with default roles, permissions, and admin user."""
    async with AsyncSessionLocal() as db:
        try:
            # Create default permissions
            permissions_data = [
                # Project permissions
                {"name": "project:create", "resource": "project", "action": "create", "description": "Create new projects"},
                {"name": "project:read", "resource": "project", "action": "read", "description": "Read own projects"},
                {"name": "project:read_all", "resource": "project", "action": "read_all", "description": "Read all projects"},
                {"name": "project:update", "resource": "project", "action": "update", "description": "Update projects"},
                {"name": "project:delete", "resource": "project", "action": "delete", "description": "Delete projects"},
                
                # Model permissions
                {"name": "model:create", "resource": "model", "action": "create", "description": "Create new models"},
                {"name": "model:read", "resource": "model", "action": "read", "description": "Read models"},
                {"name": "model:update", "resource": "model", "action": "update", "description": "Update models"},
                {"name": "model:delete", "resource": "model", "action": "delete", "description": "Delete models"},
                {"name": "model:deploy", "resource": "model", "action": "deploy", "description": "Deploy models"},
                
                # Deployment permissions
                {"name": "deployment:create", "resource": "deployment", "action": "create", "description": "Create deployments"},
                {"name": "deployment:read", "resource": "deployment", "action": "read", "description": "Read deployments"},
                {"name": "deployment:update", "resource": "deployment", "action": "update", "description": "Update deployments"},
                {"name": "deployment:delete", "resource": "deployment", "action": "delete", "description": "Delete deployments"},
                
                # Experiment permissions
                {"name": "experiment:create", "resource": "experiment", "action": "create", "description": "Create experiments"},
                {"name": "experiment:read", "resource": "experiment", "action": "read", "description": "Read experiments"},
                {"name": "experiment:update", "resource": "experiment", "action": "update", "description": "Update experiments"},
                {"name": "experiment:delete", "resource": "experiment", "action": "delete", "description": "Delete experiments"},
                
                # Pipeline permissions
                {"name": "pipeline:create", "resource": "pipeline", "action": "create", "description": "Create pipelines"},
                {"name": "pipeline:read", "resource": "pipeline", "action": "read", "description": "Read pipelines"},
                {"name": "pipeline:update", "resource": "pipeline", "action": "update", "description": "Update pipelines"},
                {"name": "pipeline:delete", "resource": "pipeline", "action": "delete", "description": "Delete pipelines"},
                {"name": "pipeline:execute", "resource": "pipeline", "action": "execute", "description": "Execute pipelines"},
                
                # User management permissions
                {"name": "user:create", "resource": "user", "action": "create", "description": "Create users"},
                {"name": "user:read", "resource": "user", "action": "read", "description": "Read users"},
                {"name": "user:update", "resource": "user", "action": "update", "description": "Update users"},
                {"name": "user:delete", "resource": "user", "action": "delete", "description": "Delete users"},
            ]
            
            permissions = {}
            for perm_data in permissions_data:
                result = await db.execute(
                    select(Permission).where(Permission.name == perm_data["name"])
                )
                perm = result.scalar_one_or_none()
                if not perm:
                    perm = Permission(**perm_data)
                    db.add(perm)
                    await db.flush()
                    print(f"Created permission: {perm_data['name']}")
                permissions[perm_data["name"]] = perm
            
            await db.commit()
            
            # Create default roles
            roles_config = {
                "admin": {
                    "description": "Full system access",
                    "permissions": list(permissions.keys())  # All permissions
                },
                "manager": {
                    "description": "Manage projects, models, and deployments",
                    "permissions": [
                        "project:create", "project:read", "project:read_all", "project:update", "project:delete",
                        "model:create", "model:read", "model:update", "model:delete", "model:deploy",
                        "deployment:create", "deployment:read", "deployment:update", "deployment:delete",
                        "experiment:create", "experiment:read", "experiment:update", "experiment:delete",
                        "pipeline:create", "pipeline:read", "pipeline:update", "pipeline:delete", "pipeline:execute",
                    ]
                },
                "developer": {
                    "description": "Develop and train models",
                    "permissions": [
                        "project:create", "project:read", "project:update",
                        "model:create", "model:read", "model:update",
                        "experiment:create", "experiment:read", "experiment:update",
                        "pipeline:create", "pipeline:read", "pipeline:update", "pipeline:execute",
                        "deployment:read",
                    ]
                },
                "viewer": {
                    "description": "Read-only access",
                    "permissions": [
                        "project:read",
                        "model:read",
                        "experiment:read",
                        "pipeline:read",
                        "deployment:read",
                    ]
                },
            }
            
            roles = {}
            for role_name, role_config in roles_config.items():
                result = await db.execute(select(Role).where(Role.name == role_name))
                role = result.scalar_one_or_none()
                if not role:
                    role = Role(
                        name=role_name,
                        description=role_config["description"]
                    )
                    # Add permissions
                    role.permissions = [permissions[perm_name] for perm_name in role_config["permissions"]]
                    db.add(role)
                    await db.flush()
                    print(f"Created role: {role_name} with {len(role.permissions)} permissions")
                roles[role_name] = role
            
            await db.commit()
            
            # Create default admin user
            result = await db.execute(select(User).where(User.username == "admin"))
            admin_user = result.scalar_one_or_none()
            if not admin_user:
                admin_user = User(
                    username="admin",
                    email="admin@mlplatform.com",
                    full_name="System Administrator",
                    hashed_password=get_password_hash("admin123"),  # Change this in production!
                    is_active=True,
                    is_superuser=True,
                    status=UserStatus.ACTIVE,
                )
                admin_user.roles = [roles["admin"]]
                db.add(admin_user)
                await db.commit()
                print(f"Created admin user with username: admin, password: admin123")
                print("⚠️  IMPORTANT: Change the default admin password immediately!")
            else:
                print("Admin user already exists")
            
            print("\n✅ RBAC initialization completed successfully!")
            print("\nDefault Roles Created:")
            print("  - admin: Full system access")
            print("  - manager: Manage projects, models, and deployments")
            print("  - developer: Develop and train models")
            print("  - viewer: Read-only access")
            print(f"\nTotal Permissions: {len(permissions)}")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error initializing RBAC: {str(e)}")
            raise


if __name__ == "__main__":
    asyncio.run(init_rbac())
