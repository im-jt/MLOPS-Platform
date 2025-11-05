#!/usr/bin/env python3
"""
Initialize database with sample data.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db.base import AsyncSessionLocal, engine
from app.models import *


async def create_sample_data():
    """Create sample data for testing."""
    async with AsyncSessionLocal() as session:
        # Check if data already exists
        result = await session.execute(select(Project))
        if result.scalar_one_or_none():
            print("Sample data already exists. Skipping...")
            return
        
        print("Creating sample projects...")
        
        # Create sample projects
        projects = [
            Project(
                id="proj-eta-prediction",
                name="ETA Prediction Model",
                description="Deep learning model for trip ETA prediction",
                tier=ProjectTier.TIER_1,
                status=ProjectStatus.ACTIVE,
                owner="john.doe@company.com",
                team="Maps Platform",
                business_unit="Mobility",
                tags=["eta", "production", "critical"],
                model_count=8,
                pipeline_count=12,
                model_excellence_score=92.0,
            ),
            Project(
                id="proj-fraud-detection",
                name="Fraud Detection",
                description="Real-time fraud detection using XGBoost",
                tier=ProjectTier.TIER_1,
                status=ProjectStatus.ACTIVE,
                owner="jane.smith@company.com",
                team="Trust & Safety",
                business_unit="Platform",
                tags=["fraud", "security", "real-time"],
                model_count=5,
                pipeline_count=8,
                model_excellence_score=88.0,
            ),
            Project(
                id="proj-restaurant-ranking",
                name="Restaurant Ranking",
                description="Restaurant ranking and recommendation system",
                tier=ProjectTier.TIER_2,
                status=ProjectStatus.ACTIVE,
                owner="bob.wilson@company.com",
                team="Eats ML",
                business_unit="Eats",
                tags=["ranking", "recommendation"],
                model_count=6,
                pipeline_count=10,
                model_excellence_score=85.0,
            ),
        ]
        
        for project in projects:
            session.add(project)
        
        print("Creating sample models...")
        
        # Create sample models
        models = [
            Model(
                id="model-deepeta",
                project_id="proj-eta-prediction",
                name="DeepETA v3",
                description="Deep learning model for ETA prediction with 100M+ parameters",
                type=ModelType.REGRESSION,
                framework=ModelFramework.PYTORCH,
                latest_version="3.2.1",
                is_production=True,
                deployment_count=3,
                owner="john.doe@company.com",
            ),
            Model(
                id="model-fraud-xgb",
                project_id="proj-fraud-detection",
                name="FraudDetector XGB",
                description="XGBoost model for real-time fraud detection",
                type=ModelType.CLASSIFICATION,
                framework=ModelFramework.XGBOOST,
                latest_version="2.1.0",
                is_production=True,
                deployment_count=5,
                owner="jane.smith@company.com",
            ),
        ]
        
        for model in models:
            session.add(model)
        
        await session.commit()
        print("✅ Sample data created successfully!")


async def main():
    """Main function."""
    print("Initializing database with sample data...")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create sample data
    await create_sample_data()
    
    print("✅ Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
