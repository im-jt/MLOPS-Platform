# Role-Based Access Control (RBAC) Implementation

This document describes the RBAC implementation for the ML Platform.

## Overview

The platform implements a comprehensive RBAC system with:
- **Users**: Authentication and user management
- **Roles**: Grouped permissions (e.g., admin, ml_engineer, data_scientist, viewer)
- **Permissions**: Fine-grained access control (e.g., `project:create`, `model:deploy`)

## Backend Implementation

### Models

#### User Model (`backend/app/models/user.py`)
- Stores user credentials and profile information
- Many-to-many relationship with Roles
- Supports superuser flag for full access

#### Role Model (`backend/app/models/user.py`)
- Groups permissions together
- System roles cannot be deleted
- Many-to-many relationship with Permissions

#### Permission Model (`backend/app/models/user.py`)
- Fine-grained permissions in format: `resource:action`
- Examples: `project:read`, `model:deploy`, `experiment:run`

### Authentication

#### JWT Tokens (`backend/app/core/security.py`)
- Uses `python-jose` for JWT token generation and validation
- Tokens expire after 30 minutes (configurable)
- OAuth2 password flow for login

#### Security Functions
- `get_current_user`: Validates JWT and returns user
- `get_current_active_user`: Ensures user is active
- `get_user_permissions`: Gets all permissions for a user
- `check_permission`: Dependency factory for permission checks
- `check_role`: Dependency factory for role checks

### API Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /auth/login`: Login with username/email and password
- `POST /auth/register`: Register new user
- `GET /auth/me`: Get current user info
- `GET /auth/me/permissions`: Get current user's permissions

#### User Management (Admin only)
- `GET /auth/users`: List all users
- `GET /auth/users/{user_id}`: Get user details
- `PUT /auth/users/{user_id}`: Update user
- `POST /auth/users/{user_id}/roles`: Assign roles to user

#### Role Management (Admin only)
- `GET /auth/roles`: List all roles
- `POST /auth/roles`: Create role
- `PUT /auth/roles/{role_id}`: Update role

#### Permission Management (Admin only)
- `GET /auth/permissions`: List all permissions
- `POST /auth/permissions`: Create permission

### Default Roles and Permissions

The system includes default roles:

1. **admin**: Full access to all resources
   - All permissions (`*`)

2. **ml_engineer**: Full ML platform access
   - Project: read, create, update, delete
   - Model: read, create, update, delete, deploy
   - Experiment: read, create, run
   - Pipeline: read, create, run
   - Deployment: read, create, manage
   - Monitoring: read, manage
   - GenAI: use, manage

3. **data_scientist**: Experiment and model access
   - Project: read, create, update
   - Model: read, create, update
   - Experiment: read, create, run
   - Pipeline: read, create, run
   - Deployment: read
   - Monitoring: read
   - GenAI: use

4. **viewer**: Read-only access
   - Project: read
   - Model: read
   - Experiment: read
   - Pipeline: read
   - Deployment: read
   - Monitoring: read

### Initialization

Run the initialization script to create default roles and permissions:

```bash
cd backend
python scripts/init_rbac.py
```

This creates:
- All default permissions
- All default roles with their permissions
- A default admin user (email: `admin@example.com`, password: `admin123`)

### Using RBAC in Endpoints

Example of protecting an endpoint:

```python
from app.core.security import get_current_active_user, get_user_permissions
from app.models.user import User

@router.post("/projects")
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    permissions = await get_user_permissions(current_user, db)
    
    if "*" not in permissions and "project:create" not in permissions:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Create project...
```

## Frontend Implementation

### Auth Service (`src/services/auth.service.ts`)

The auth service manages:
- User authentication state (signals)
- JWT token storage (localStorage)
- Permission checking
- Role checking

Key methods:
- `login()`: Authenticate user
- `hasPermission()`: Check if user has permission
- `hasRole()`: Check if user has role
- `logout()`: Clear auth state

### Guards

#### Auth Guard (`src/guards/auth.guard.ts`)
Protects routes requiring authentication.

```typescript
{ path: 'projects', component: ProjectDashboardComponent, canActivate: [authGuard] }
```

#### Permission Guard (`src/guards/permission.guard.ts`)
Protects routes based on permissions.

```typescript
{ path: 'projects', component: ProjectDashboardComponent, canActivate: [authGuard, permissionGuard('project:read')] }
```

#### Role Guard (`src/guards/role.guard.ts`)
Protects routes based on roles.

```typescript
{ path: 'admin', component: AdminComponent, canActivate: [roleGuard(['admin'])] }
```

### Directives

#### HasPermission Directive (`src/directives/has-permission.directive.ts`)
Conditionally render content based on permissions.

```html
<div *hasPermission="'project:create'">
  <button>Create Project</button>
</div>

<div *hasPermission="['project:create', 'project:update']">
  <button>Create or Update</button>
</div>
```

#### HasRole Directive (`src/directives/has-role.directive.ts`)
Conditionally render content based on roles.

```html
<div *hasRole="'admin'">
  <button>Admin Actions</button>
</div>
```

### HTTP Interceptor (`src/interceptors/auth.interceptor.ts`)

Automatically adds JWT token to all HTTP requests.

### Components

#### Login Component (`src/components/login/login.component.ts`)
- Login form with username/email and password
- Error handling
- Redirects to return URL after login

#### Unauthorized Component (`src/components/unauthorized/unauthorized.component.ts`)
- Shows 403 error page
- Displayed when user lacks required permissions

## Usage Examples

### Backend: Protecting an Endpoint

```python
@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    permissions = await get_user_permissions(current_user, db)
    
    # Check permission
    if "*" not in permissions and "project:delete" not in permissions:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Or check ownership
    project = await get_project(project_id, db)
    if project.owner != current_user.username:
        if "*" not in permissions and "project:delete" not in permissions:
            raise HTTPException(status_code=403, detail="Can only delete own projects")
    
    # Delete project...
```

### Frontend: Protecting a Route

```typescript
export const APP_ROUTES: Routes = [
  { 
    path: 'projects', 
    component: ProjectDashboardComponent,
    canActivate: [authGuard, permissionGuard('project:read')]
  },
];
```

### Frontend: Conditional UI Rendering

```html
<!-- Show button only if user has permission -->
<button *hasPermission="'project:create'" (click)="createProject()">
  Create Project
</button>

<!-- Show admin panel only for admins -->
<div *hasRole="'admin'">
  <app-admin-panel></app-admin-panel>
</div>
```

### Frontend: Checking Permissions in Component

```typescript
import { AuthService } from '../services/auth.service';

export class ProjectComponent {
  constructor(private authService: AuthService) {}
  
  canCreate(): boolean {
    return this.authService.hasPermission('project:create');
  }
  
  canDelete(): boolean {
    return this.authService.hasPermission('project:delete');
  }
}
```

## Database Migration

After adding the RBAC models, create a migration:

```bash
cd backend
alembic revision --autogenerate -m "Add RBAC models"
alembic upgrade head
```

Then initialize default data:

```bash
python scripts/init_rbac.py
```

## Security Considerations

1. **Password Hashing**: Uses bcrypt via `passlib`
2. **JWT Tokens**: Signed with SECRET_KEY, expire after 30 minutes
3. **Permission Checks**: Always check permissions server-side
4. **Role Hierarchy**: Superusers (`is_superuser=True`) have all permissions
5. **Ownership**: Users can access their own resources even without explicit permissions

## Testing

### Backend Testing

```python
# Test permission check
async def test_create_project_permission():
    user = await create_test_user(permissions=["project:create"])
    # Test project creation...
```

### Frontend Testing

```typescript
// Mock auth service
const mockAuthService = {
  hasPermission: (perm: string) => perm === 'project:create',
  isAuthenticated: () => true,
};
```

## Future Enhancements

1. **Resource-level permissions**: Permissions on specific projects/models
2. **Team-based access**: Access based on team membership
3. **Audit logging**: Log all permission checks and access attempts
4. **Permission inheritance**: Hierarchical permissions
5. **Temporary permissions**: Time-limited access grants
