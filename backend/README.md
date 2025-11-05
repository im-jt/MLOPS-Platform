# ML Platform Backend API

Enterprise-grade Python backend for the ML Platform with MLOps capabilities.

## 🏗️ Technology Stack

- **Framework**: FastAPI 0.109
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0 (async)
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **ML Tracking**: MLflow 2.10
- **Migration**: Alembic
- **API Docs**: OpenAPI (Swagger/ReDoc)

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── projects.py      # Project endpoints
│   │       ├── models.py         # Model registry endpoints
│   │       ├── deployments.py    # Deployment endpoints
│   │       ├── experiments.py    # Experiment tracking
│   │       ├── pipelines.py      # Pipeline management
│   │       ├── monitoring.py     # Monitoring endpoints
│   │       └── genai.py          # GenAI/LLM endpoints
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   ├── security.py           # Auth & security
│   │   └── dependencies.py       # FastAPI dependencies
│   ├── db/
│   │   └── base.py               # Database setup
│   ├── models/                   # SQLAlchemy models
│   │   ├── project.py
│   │   ├── model.py
│   │   ├── deployment.py
│   │   ├── experiment.py
│   │   ├── pipeline.py
│   │   ├── monitoring.py
│   │   └── genai.py
│   ├── schemas/                  # Pydantic schemas
│   │   ├── project.py
│   │   ├── model.py
│   │   └── ...
│   ├── services/                 # Business logic
│   │   ├── project_service.py
│   │   ├── model_service.py
│   │   ├── mlflow_service.py
│   │   ├── storage_service.py
│   │   └── ...
│   ├── utils/                    # Utilities
│   └── main.py                   # FastAPI app
├── alembic/                      # Database migrations
├── tests/                        # Test suite
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# API will be available at http://localhost:8000
```

### Option 2: Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL
createdb mlplatform

# Copy and configure .env
cp .env.example .env
nano .env

# Run migrations
alembic upgrade head

# Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🗄️ Database Setup

### Create Initial Migration

```bash
# Generate migration from models
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

### Migration Commands

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

## 📚 API Documentation

Once the server is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔑 API Endpoints

### Projects

```
GET    /api/v1/projects              - List projects
POST   /api/v1/projects              - Create project
GET    /api/v1/projects/{id}         - Get project
PUT    /api/v1/projects/{id}         - Update project
DELETE /api/v1/projects/{id}         - Delete project
GET    /api/v1/projects/{id}/stats   - Get project stats
```

### Models

```
GET    /api/v1/models                     - List models
POST   /api/v1/models                     - Create model
GET    /api/v1/models/{id}                - Get model
PUT    /api/v1/models/{id}                - Update model
DELETE /api/v1/models/{id}                - Delete model
GET    /api/v1/models/{id}/versions       - List versions
POST   /api/v1/models/{id}/versions       - Create version
```

### Deployments

```
GET    /api/v1/deployments                - List deployments
POST   /api/v1/deployments                - Create deployment
GET    /api/v1/deployments/{id}           - Get deployment
PUT    /api/v1/deployments/{id}           - Update deployment
DELETE /api/v1/deployments/{id}           - Delete deployment
POST   /api/v1/deployments/{id}/rollback  - Rollback deployment
```

### Experiments

```
GET    /api/v1/experiments                - List experiments
POST   /api/v1/experiments                - Create experiment
GET    /api/v1/experiments/{id}           - Get experiment
POST   /api/v1/experiments/{id}/runs      - Create run
```

### Pipelines

```
GET    /api/v1/pipelines                  - List pipelines
POST   /api/v1/pipelines                  - Create pipeline
GET    /api/v1/pipelines/{id}             - Get pipeline
POST   /api/v1/pipelines/{id}/run         - Execute pipeline
GET    /api/v1/pipelines/{id}/runs        - List runs
```

### Monitoring

```
GET    /api/v1/monitoring/models/{id}     - Get model monitoring
GET    /api/v1/monitoring/alerts          - List alerts
POST   /api/v1/monitoring/alerts/{id}/ack - Acknowledge alert
```

### GenAI

```
GET    /api/v1/genai/llms                 - List LLM models
GET    /api/v1/genai/prompts              - List prompt templates
POST   /api/v1/genai/prompts              - Create prompt
POST   /api/v1/genai/finetuning           - Create fine-tuning job
GET    /api/v1/genai/finetuning/{id}      - Get job status
```

## 🔧 Configuration

Key environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/mlplatform

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage
STORAGE_TYPE=minio  # or 's3', 'local'
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# GenAI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_API_KEY=...
```

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_projects.py
```

## 📦 Dependencies

### Core
- **fastapi**: Modern web framework
- **uvicorn**: ASGI server
- **sqlalchemy**: ORM with async support
- **alembic**: Database migrations
- **pydantic**: Data validation

### ML & Data
- **mlflow**: Experiment tracking
- **scikit-learn**: ML algorithms
- **pandas**: Data manipulation
- **numpy**: Numerical computing

### Storage & Cache
- **redis**: Caching layer
- **boto3**: S3/MinIO client
- **minio**: Object storage client

### Monitoring
- **prometheus-client**: Metrics
- **opentelemetry**: Observability

## 🔐 Authentication

The API uses JWT tokens for authentication:

```python
# Login endpoint
POST /api/v1/auth/login
{
  "username": "user@example.com",
  "password": "password"
}

# Returns
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}

# Use token in headers
Authorization: Bearer eyJ...
```

## 📊 Monitoring

### Prometheus Metrics

Available at `/metrics`:

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request latency
- `model_predictions_total`: Total predictions
- `model_training_duration_seconds`: Training time

### Health Checks

```bash
# Basic health
GET /health

# Detailed health
GET /health/detailed
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Change `SECRET_KEY`
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set resource limits
- [ ] Enable rate limiting
- [ ] Configure logging

### Docker Production Build

```bash
# Build image
docker build -t ml-platform-api:latest .

# Run container
docker run -d \
  --name ml-platform-api \
  -p 8000:8000 \
  --env-file .env.production \
  ml-platform-api:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-platform-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-platform-api
  template:
    metadata:
      labels:
        app: ml-platform-api
    spec:
      containers:
      - name: api
        image: ml-platform-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 🔍 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -h localhost -U mlplatform -d mlplatform

# Check migrations
alembic current

# Reset database (development only!)
alembic downgrade base
alembic upgrade head
```

### Performance Tuning

```python
# Adjust database pool size
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Enable query logging
SQLALCHEMY_ECHO=True

# Adjust worker processes
uvicorn app.main:app --workers 4
```

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📄 License

MIT License - See LICENSE file
