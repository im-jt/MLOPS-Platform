.PHONY: help install dev docker-up docker-down test lint format clean

help:
	@echo "ML Platform Backend - Available Commands:"
	@echo ""
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run development server"
	@echo "  make docker-up     - Start all services with Docker Compose"
	@echo "  make docker-down   - Stop all Docker services"
	@echo "  make migrate       - Run database migrations"
	@echo "  make migration     - Create new migration"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linters"
	@echo "  make format        - Format code"
	@echo "  make clean         - Clean temporary files"

install:
	pip install -r requirements.txt

dev:
	bash scripts/run_dev.sh

docker-up:
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "   API: http://localhost:8000"
	@echo "   Docs: http://localhost:8000/docs"
	@echo "   MLflow: http://localhost:5000"
	@echo "   MinIO Console: http://localhost:9001"

docker-down:
	docker-compose down

migrate:
	alembic upgrade head

migration:
	@read -p "Enter migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

test:
	pytest -v --cov=app --cov-report=html

lint:
	ruff check app/
	mypy app/

format:
	black app/
	ruff check --fix app/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
