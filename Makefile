# Makefile for Instagram Analytics
# Quick commands for development and deployment

.PHONY: help install dev test lint format docker-build docker-run docker-stop clean deploy-k8s deploy-aws

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Instagram Analytics - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install dependencies
	pip install -r requirements.txt

install-dev: ## Install development dependencies
	pip install -r requirements-dev.txt

# Development
dev: ## Run development server
	streamlit run dashboard.py

test: ## Run tests
	pytest tests/ -v --cov=src --cov-report=html

lint: ## Run linters
	flake8 src/ dashboard.py
	mypy src/
	pylint src/

format: ## Format code
	black src/ dashboard.py
	isort src/ dashboard.py

# Docker
docker-build: ## Build Docker image
	docker build -t instagram-analytics:latest -f Dockerfile.prod .

docker-run: ## Run Docker container
	docker run -d -p 8501:8501 --name instagram-analytics instagram-analytics:latest

docker-stop: ## Stop Docker container
	docker stop instagram-analytics
	docker rm instagram-analytics

docker-compose-dev: ## Run with docker-compose (dev)
	docker-compose up -d

docker-compose-prod: ## Run with docker-compose (prod)
	docker-compose -f docker-compose.prod.yml up -d

docker-compose-down: ## Stop docker-compose
	docker-compose down

# Kubernetes
deploy-k8s: ## Deploy to Kubernetes
	kubectl apply -f kubernetes/deployment.yaml
	kubectl get pods -n instagram-analytics

k8s-logs: ## View Kubernetes logs
	kubectl logs -f deployment/instagram-analytics -n instagram-analytics

k8s-delete: ## Delete Kubernetes deployment
	kubectl delete -f kubernetes/deployment.yaml

# AWS (Terraform)
deploy-aws: ## Deploy to AWS with Terraform
	cd terraform/aws && terraform init && terraform apply

aws-destroy: ## Destroy AWS infrastructure
	cd terraform/aws && terraform destroy

aws-outputs: ## Show AWS outputs
	cd terraform/aws && terraform output

# Monitoring
monitoring: ## Open monitoring dashboard
	@echo "Opening monitoring dashboard..."
	@echo "Navigate to the Monitoring tab in the Streamlit app"

# Cleaning
clean: ## Clean cache and build artifacts
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf .cache/
	rm -rf htmlcov/
	rm -rf dist/
	rm -rf build/

clean-docker: ## Clean Docker resources
	docker system prune -af --volumes

# Data
backup-cache: ## Backup cache directory
	tar -czf cache-backup-$$(date +%Y%m%d-%H%M%S).tar.gz .cache/

restore-cache: ## Restore cache from backup (specify file with BACKUP=filename)
	tar -xzf $(BACKUP) -C .

# Documentation
docs: ## Generate documentation
	cd docs && make html

docs-serve: ## Serve documentation locally
	cd docs/_build/html && python -m http.server 8000

# Version
version: ## Show version
	@echo "Instagram Analytics v1.0.0"

# Pre-commit
setup-git-hooks: ## Setup git hooks
	pre-commit install

# Quick checks
check: lint test ## Run linters and tests

# Build for production
build: clean test docker-build ## Clean, test, and build Docker image
	@echo "Build completed successfully!"

# Full deployment check
deploy-check: ## Pre-deployment checklist
	@echo "🔍 Running pre-deployment checks..."
	@echo ""
	@echo "✅ 1. Testing..."
	@make test
	@echo ""
	@echo "✅ 2. Linting..."
	@make lint
	@echo ""
	@echo "✅ 3. Building Docker image..."
	@make docker-build
	@echo ""
	@echo "🎉 All checks passed! Ready to deploy."
