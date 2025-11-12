# RBAC Quick Start Guide

Get your ML Platform up and running with RBAC in minutes!

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL database
- Redis (optional, for caching)

## Step 1: Setup Backend

### 1.1 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 1.2 Configure Environment

Create a `.env` file in the `backend` directory:

```env
# Application
APP_NAME=ML Platform API
DEBUG=True
ENVIRONMENT=development
SECRET_KEY=your-super-secret-key-change-in-production

# API
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mlplatform

# CORS
CORS_ORIGINS=["http://localhost:4200"]

# Other settings (optional)
REDIS_URL=redis://localhost:6379/0
MLFLOW_TRACKING_URI=http://localhost:5000
```

**⚠️ Important:** Generate a strong SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 1.3 Run Database Migration

```bash
cd backend
alembic upgrade head
```

This creates all necessary tables including:
- users
- roles
- permissions
- user_roles (association table)
- role_permissions (association table)
- Updates projects table with owner_id

### 1.4 Initialize RBAC System

```bash
cd backend
python3 scripts/init_rbac.py
```

This creates:
- ✅ Default permissions (project, model, deployment, experiment, pipeline, user)
- ✅ Default roles (admin, manager, developer, viewer)
- ✅ Admin user (username: `admin`, password: `admin123`)

**Output:**
```
Created permission: project:create
Created permission: project:read
...
Created role: admin with 30 permissions
Created role: manager with 20 permissions
Created role: developer with 12 permissions
Created role: viewer with 5 permissions
Created admin user with username: admin, password: admin123
⚠️  IMPORTANT: Change the default admin password immediately!
✅ RBAC initialization completed successfully!
```

### 1.5 Start Backend Server

```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Step 2: Setup Frontend

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Start Development Server

```bash
npm start
```

Frontend will be available at: http://localhost:4200

## Step 3: First Login

1. Navigate to http://localhost:4200
2. You'll be redirected to the login page
3. Use default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
4. After login, you'll be redirected to the home page

## Step 4: Change Default Password

1. After logging in, navigate to your profile (you can access via user menu)
2. Change your password immediately:
   - Click on user profile/settings
   - Enter current password: `admin123`
   - Enter new secure password
   - Confirm new password
   - Save changes

## Step 5: Create Your First User

1. Navigate to User Management: http://localhost:4200/#/users
2. Click "Add User" button
3. Fill in user details:
   - Username
   - Email
   - Full Name
   - Password
   - Select role(s)
4. Click "Create"

## Step 6: Test Permissions

### As Admin:
- ✅ Access all features
- ✅ Manage users
- ✅ Create/edit/delete projects
- ✅ Full system access

### As Developer:
- ✅ Create and manage projects
- ✅ Train models
- ✅ Run experiments
- ✅ Execute pipelines
- ❌ Cannot manage users
- ❌ Cannot delete projects

### As Viewer:
- ✅ View all resources
- ❌ Cannot create/edit/delete anything
- ❌ Cannot access user management

## API Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Get Current User
```bash
TOKEN="your_token_here"

curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### List Users (Admin Only)
```bash
curl -X GET http://localhost:8000/api/v1/auth/users \
  -H "Authorization: Bearer $TOKEN"
```

### Create Project (Requires permission)
```bash
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My ML Project",
    "description": "Test project",
    "tier": "tier-1",
    "team": "Data Science",
    "business_unit": "Engineering"
  }'
```

## Common Issues & Solutions

### Issue: Database connection error
**Solution:** 
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### Issue: 401 Unauthorized
**Solution:**
- Check if token is expired (default 30 minutes)
- Verify token is in Authorization header
- Ensure user account is active

### Issue: 403 Forbidden
**Solution:**
- User doesn't have required permission
- Check user's roles in User Management
- Verify role has required permissions

### Issue: Import errors in backend
**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue: Frontend not connecting to backend
**Solution:**
- Check backend is running on port 8000
- Verify CORS_ORIGINS in backend .env
- Check browser console for errors

## Development Tips

### Hot Reload
Both frontend and backend support hot reload during development:
- Backend: `--reload` flag in uvicorn
- Frontend: Angular dev server watches for changes

### Debug Mode
Enable debug mode in backend `.env`:
```env
DEBUG=True
LOG_LEVEL=DEBUG
```

### Testing Permissions
Use different browser profiles or incognito windows to test different user roles simultaneously.

## Production Deployment

### Security Checklist
- [ ] Change default admin password
- [ ] Generate strong SECRET_KEY
- [ ] Use HTTPS only
- [ ] Set DEBUG=False
- [ ] Configure proper CORS_ORIGINS
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Environment Variables
```env
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=<strong-secret-key>
DATABASE_URL=<production-database-url>
CORS_ORIGINS=["https://your-domain.com"]
```

## Next Steps

1. **Customize Roles**: Modify roles in `init_rbac.py` to match your organization
2. **Add Permissions**: Extend permissions for new resources
3. **Integrate with SSO**: Add OAuth2/OIDC for enterprise authentication
4. **Audit Logging**: Implement audit logs for compliance
5. **Multi-tenancy**: Add organization/team-based isolation

## Resources

- Full documentation: [RBAC_IMPLEMENTATION_GUIDE.md](./RBAC_IMPLEMENTATION_GUIDE.md)
- API Documentation: http://localhost:8000/docs
- Frontend: http://localhost:4200

## Support

For help or issues:
1. Check the full implementation guide
2. Review API documentation at `/docs`
3. Check browser console and backend logs
4. Verify environment configuration

---

**🎉 Congratulations!** Your ML Platform is now secured with RBAC!
