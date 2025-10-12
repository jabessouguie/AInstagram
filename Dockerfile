# Instagram Analytics - Déploiement Multi-environnement
# Support: Docker, Kubernetes, Cloud (AWS/GCP/Azure), On-premise

FROM python:3.9-slim

# Métadonnées
LABEL maintainer="Instagram Analytics Team"
LABEL version="1.0.0"
LABEL description="Instagram Data Analytics Dashboard"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    STREAMLIT_SERVER_PORT=8501 \
    STREAMLIT_SERVER_ADDRESS=0.0.0.0 \
    STREAMLIT_SERVER_HEADLESS=true \
    STREAMLIT_BROWSER_GATHER_USAGE_STATS=false

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Créer l'utilisateur non-root
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /app/.cache /app/instagram_data && \
    chown -R appuser:appuser /app

# Définir le répertoire de travail
WORKDIR /app

# Copier les requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY --chown=appuser:appuser . .

# Changer vers l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 8501

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

# Commande de démarrage
CMD ["streamlit", "run", "dashboard.py", "--server.port=8501", "--server.address=0.0.0.0"]
