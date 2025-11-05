import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_root():
    """Test root endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "name" in response.json()


@pytest.mark.asyncio
async def test_health():
    """Test health endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_list_projects():
    """Test listing projects."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/projects/")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_project():
    """Test creating a project."""
    project_data = {
        "name": "Test Project",
        "description": "A test project",
        "tier": "tier-3",
        "owner": "test@example.com",
        "team": "Test Team",
        "business_unit": "Engineering",
        "tags": ["test"]
    }
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/projects/", json=project_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == project_data["name"]
    assert data["tier"] == project_data["tier"]
    assert "id" in data
