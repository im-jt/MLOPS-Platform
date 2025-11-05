from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "ML Platform API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 0
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Storage
    STORAGE_TYPE: str = "local"  # local, s3, minio
    STORAGE_PATH: str = "/tmp/mlplatform/storage"
    S3_BUCKET: str = "ml-platform-models"
    S3_REGION: str = "us-west-2"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    
    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_ARTIFACT_ROOT: str = "s3://mlflow-artifacts"
    
    # Model Serving
    TRITON_URL: str = "localhost:8001"
    TRITON_GRPC_URL: str = "localhost:8000"
    
    # Monitoring
    ENABLE_METRICS: bool = True
    PROMETHEUS_PORT: int = 9090
    
    # Ray Cluster
    RAY_ADDRESS: str = "auto"
    RAY_DASHBOARD_HOST: str = "localhost:8265"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://localhost:3000",
    ]
    
    # GenAI
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    
    # Feature Store
    FEAST_REPO_PATH: str = "/path/to/feast/repo"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


settings = Settings()
