# 🚀 Backend Quick Start

## ⚡ Fastest Way to Get Started

### 1-Minute Setup (Docker)

```bash
cd backend
cp .env.example .env
make docker-up
```

**That's it!** 🎉

Services running:
- ✅ **API**: http://localhost:8000
- ✅ **API Docs**: http://localhost:8000/docs
- ✅ **MLflow**: http://localhost:5000
- ✅ **MinIO Console**: http://localhost:9001 (login: minioadmin/minioadmin)

---

## 📋 What Just Happened?

The `make docker-up` command started 5 services:

1. **PostgreSQL** - Database for all data
2. **Redis** - Caching layer
3. **MinIO** - S3-compatible storage for models
4. **MLflow** - Experiment tracking
5. **FastAPI** - Your API server

---

## 🧪 Test the API

### Via Browser
Visit: http://localhost:8000/docs

### Via curl
```bash
# Health check
curl http://localhost:8000/health

# List projects
curl http://localhost:8000/api/v1/projects/

# Create a project
curl -X POST http://localhost:8000/api/v1/projects/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "tier": "tier-3",
    "owner": "you@example.com",
    "team": "ML Team",
    "business_unit": "Engineering",
    "tags": ["test"]
  }'
```

---

## 📊 View Services

| Service | URL | Credentials |
|---------|-----|-------------|
| API | http://localhost:8000 | None |
| API Docs | http://localhost:8000/docs | None |
| MLflow | http://localhost:5000 | None |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | mlplatform / mlplatform |
| Redis | localhost:6379 | None |

---

## 🛠️ Common Commands

```bash
# Start all services
make docker-up

# Stop all services
make docker-down

# View logs
docker-compose logs -f api

# Restart API only
docker-compose restart api

# Check service status
docker-compose ps

# Enter API container
docker-compose exec api bash
```

---

## 📝 Sample Data

The API comes with sample data:
- **3 Projects** (Tier 1-2)
- **2 Models** (DeepETA, FraudDetector)

To reset:
```bash
docker-compose down -v  # Delete volumes
make docker-up          # Restart
```

---

## 🔧 Configuration

Edit `.env` file to customize:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://mlplatform:mlplatform@postgres:5432/mlplatform

# Storage
STORAGE_TYPE=minio  # or 's3', 'local'

# API
DEBUG=True
CORS_ORIGINS=["http://localhost:4200"]
```

---

## 🐛 Troubleshooting

### Ports already in use?
```bash
# Check what's using the port
lsof -i :8000
lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

### Services won't start?
```bash
# Clean everything and restart
make docker-down
docker system prune -f
make docker-up
```

### Database issues?
```bash
# Reset database
docker-compose down -v
make docker-up
```

---

## 🎯 Next Steps

1. ✅ Test API at http://localhost:8000/docs
2. 🔄 Connect frontend to backend
3. 📊 View experiments in MLflow
4. 🎨 Customize and extend

---

## 📚 Full Documentation

See **README.md** for complete documentation.

---

**Status**: ✅ Running
**Services**: 5/5 healthy
**API Docs**: http://localhost:8000/docs
