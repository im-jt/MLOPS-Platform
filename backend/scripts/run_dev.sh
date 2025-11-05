#!/bin/bash
# Development startup script

set -e

echo "🚀 Starting ML Platform Backend Development Server"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Wait for database (if using docker-compose)
if command -v docker-compose &> /dev/null; then
    echo "⏳ Waiting for database..."
    sleep 3
fi

# Run migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Initialize sample data
echo "📊 Initializing sample data..."
python scripts/init_db.py

# Start the server
echo ""
echo "✨ Starting FastAPI server..."
echo "📍 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "📖 ReDoc: http://localhost:8000/redoc"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
