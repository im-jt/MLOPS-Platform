# RBAC Implementation Guide

This guide explains how the Role-Based Access Control (RBAC) system has been implemented in the ML Platform.

## Overview

The RBAC system provides fine-grained access control for users, allowing you to manage permissions at both the role and resource level.

## Backend Implementation

### 1. Database Models

**Location:** `/workspace/backend/app/models/user.py`

- **User Model**: Stores user information, credentials, and status
- **Role Model**: Defines roles with associated permissions
- **Permission Model**: Granular permissions for resources and actions
- **Association Tables**: Many-to-many relationships between users-roles and roles-permissions

### 2. Authentication & Authorization

**Location:** `/workspace/backend/app/utils/auth.py`

Key features:
- JWT token-based authentication
- Password hashing with bcrypt
- Permission checking utilities
- Role-based decorators
- Current user dependency injection

### 3. API Endpoints

**Location:** `/workspace/backend/app/api/v1/auth.py`

Endpoints provided:
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/auth/me` - Get current user info
- `PUT /api/v1/auth/me` - Update current user
- `POST /api/v1/auth/me/change-password` - Change password
- `POST /api/v1/auth/users` - Create user (admin only)
- `GET /api/v1/auth/users` - List users (admin only)
- `GET /api/v1/auth/users/{id}` - Get user details (admin only)
- `PUT /api/v1/auth/users/{id}` - Update user (admin only)
- `DELETE /api/v1/auth/users/{id}` - Delete user (admin only)
- Role and Permission management endpoints

### 4. Protected Resources

**Example:** `/workspace/backend/app/api/v1/projects.py`

Projects API has been updated with RBAC:
- Users can only see their own projects unless they have `project:read_all` permission
- Creating projects requires `project:create` permission
- Updating/deleting requires ownership or appropriate permissions

## Frontend Implementation

### 1. Auth Service

**Location:** `/workspace/src/services/auth.service.ts`

Features:
- Login/logout functionality
- Current user state management with RxJS
- Token management (localStorage)
- Permission and role checking methods
- User/role/permission management APIs

### 2. Route Guards

**Location:** `/workspace/src/guards/auth.guard.ts`

Protects routes based on:
- Authentication status
- Required roles
- Required permissions

### 3. HTTP Interceptor

**Location:** `/workspace/src/interceptors/auth.interceptor.ts`

Automatically:
- Adds Authorization header to requests
- Handles 401 errors by redirecting to login
- Manages token lifecycle

### 4. UI Components

**Login Component:** `/workspace/src/components/login/`
- Modern, responsive login form
- Error handling
- Return URL support

**User Management Component:** `/workspace/src/components/user-management/`
- Admin interface for managing users
- Create, edit, delete users
- Assign roles to users
- View user permissions

## Database Migration

**Location:** `/workspace/backend/alembic/versions/001_add_rbac_system.py`

Run the migration:
```bash
cd backend
alembic upgrade head
```

## Initial Setup

**Script:** `/workspace/backend/scripts/init_rbac.py`

Run this script to initialize the RBAC system with default data:

```bash
cd backend
python3 scripts/init_rbac.py
```

This creates:
- Default permissions for all resources
- Four default roles: admin, manager, developer, viewer
- An admin user (username: `admin`, password: `admin123`)

### Default Roles

1. **Admin**
   - Full system access
   - All permissions
   - User management

2. **Manager**
   - Manage projects, models, and deployments
   - Create, read, update, delete resources
   - Cannot manage users

3. **Developer**
   - Develop and train models
   - Create/read/update projects, models, experiments
   - Execute pipelines
   - Read-only access to deployments

4. **Viewer**
   - Read-only access
   - View projects, models, experiments, pipelines, deployments

## Configuration

Update `/workspace/backend/.env`:

```env
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Usage Examples

### Backend - Protecting an Endpoint

```python
from app.utils.auth import require_permission, get_current_user

@router.post("/")
async def create_resource(
    data: ResourceCreate,
    current_user: User = Depends(require_permission("resource", "create"))
):
    # Only users with resource:create permission can access
    pass
```

### Backend - Checking Permissions

```python
from app.utils.auth import check_user_permission

if check_user_permission(current_user, "project", "delete"):
    # User has permission to delete projects
    pass
```

### Frontend - Using Auth Service

```typescript
// Check if user has permission
if (this.authService.hasPermission('project', 'create')) {
  // Show create button
}

// Check if user has role
if (this.authService.hasRole(['admin', 'manager'])) {
  // Show admin features
}

// Get current user
this.authService.currentUser$.subscribe(user => {
  console.log('Current user:', user);
});
```

### Frontend - Protecting Routes

```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard],
  data: { roles: ['admin'] }
}

{
  path: 'projects',
  component: ProjectsComponent,
  canActivate: [AuthGuard],
  data: { 
    permission: { resource: 'project', action: 'read' }
  }
}
```

## Security Best Practices

1. **Change Default Password**: Immediately change the default admin password after initialization
2. **Use Strong Secrets**: Generate a strong SECRET_KEY for JWT tokens
3. **HTTPS Only**: Use HTTPS in production for all API communications
4. **Token Expiration**: Configure appropriate token expiration times
5. **Password Policy**: Implement password complexity requirements
6. **Audit Logging**: Add audit logging for sensitive operations
7. **Regular Reviews**: Regularly review user permissions and roles

## API Testing

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create User (Admin Only)
```bash
curl -X POST http://localhost:8000/api/v1/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "secure123",
    "full_name": "John Doe",
    "role_ids": [2]
  }'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if token is expired
   - Verify token is being sent in Authorization header
   - Ensure user account is active

2. **403 Forbidden**
   - User doesn't have required permission
   - Check user's roles and permissions
   - Verify role has the required permission assigned

3. **Migration Issues**
   - Ensure database is accessible
   - Check Alembic configuration
   - Review migration script for errors

## Future Enhancements

- [ ] Multi-factor authentication (MFA)
- [ ] OAuth2/OIDC integration
- [ ] Password reset via email
- [ ] Session management
- [ ] IP-based access restrictions
- [ ] Advanced audit logging
- [ ] Resource-level permissions (e.g., per-project access)
- [ ] Team-based permissions
- [ ] Permission inheritance

## Support

For issues or questions, please refer to the main README or open an issue in the repository.
