# RBAC Setup Guide

## Quick Start

### 1. Backend Setup

#### Install Dependencies
The required dependencies are already in `requirements.txt`:
- `python-jose[cryptography]` - JWT tokens
- `passlib[bcrypt]` - Password hashing

#### Database Migration
Create and run the migration for RBAC tables:

```bash
cd backend
alembic revision --autogenerate -m "Add RBAC models"
alembic upgrade head
```

#### Initialize Default Data
Run the initialization script to create default roles, permissions, and admin user:

```bash
python scripts/init_rbac.py
```

This creates:
- Default permissions (project:read, project:create, model:deploy, etc.)
- Default roles (admin, ml_engineer, data_scientist, viewer)
- Admin user: `admin@example.com` / `admin123`

### 2. Frontend Setup

The frontend is already configured with:
- Auth service (`src/services/auth.service.ts`)
- Guards (`src/guards/`)
- Directives (`src/directives/`)
- HTTP interceptor (`src/interceptors/auth.interceptor.ts`)
- Login component (`src/components/login/login.component.ts`)

### 3. Environment Variables

Make sure your `.env` file has:

```bash
SECRET_KEY=your-secret-key-here  # Used for JWT signing
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
```

## Testing the Implementation

### 1. Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Login
Navigate to `http://localhost:4200/login` and login with:
- Username: `admin`
- Password: `admin123`

### 4. Test Permissions

Try accessing different routes:
- `/projects` - Requires `project:read` permission
- `/genai` - Requires `genai:use` permission
- Admin routes - Require admin role

## Default Roles

### Admin
- Full access to everything
- Can manage users, roles, and permissions

### ML Engineer
- Full ML platform access
- Can create, update, delete projects and models
- Can deploy models
- Can manage deployments and monitoring

### Data Scientist
- Can create and run experiments
- Can create and update models
- Read-only access to deployments
- Can use GenAI features

### Viewer
- Read-only access to all resources
- Cannot create, update, or delete anything

## API Usage Examples

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

### Get Current User
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Project (requires project:create permission)
```bash
curl -X POST "http://localhost:8000/api/v1/projects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "tier": "tier-1", "owner": "admin", "team": "ML Team", "business_unit": "Engineering"}'
```

## Troubleshooting

### Issue: "Could not validate credentials"
- Check that SECRET_KEY is set in environment
- Verify token hasn't expired (default: 30 minutes)
- Ensure token is sent in Authorization header: `Bearer TOKEN`

### Issue: "Permission denied"
- Check user's roles and permissions
- Verify endpoint requires correct permission
- Superusers should have `*` permission

### Issue: Frontend not sending token
- Check that HTTP interceptor is configured in `index.tsx`
- Verify `provideHttpClient` is included in providers

## Next Steps

1. **Customize Permissions**: Add custom permissions for your use case
2. **Create Custom Roles**: Define roles specific to your organization
3. **Add Resource-Level Permissions**: Implement permissions on specific resources
4. **Add Audit Logging**: Track all permission checks and access attempts
5. **Implement Team-Based Access**: Add team membership for access control

For detailed implementation documentation, see `RBAC_IMPLEMENTATION.md`.
