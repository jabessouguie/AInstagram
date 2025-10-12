# 🏗️ Architecture Scalable - Instagram Analytics

## Vue d'ensemble

Architecture microservices pour déploiements haute disponibilité et scalabilité horizontale.

## 🎯 Objectifs

- **Scalabilité horizontale**: Supporter 1000+ utilisateurs simultanés
- **Haute disponibilité**: 99.9% uptime
- **Performance**: < 2s temps de réponse moyen
- **Résilience**: Tolérance aux pannes
- **Observabilité**: Monitoring complet

## 📐 Architecture Microservices

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                           │
│                    (AWS ALB / GCP LB / Nginx)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │  Frontend   │  │  Frontend   │  │  Frontend  │
    │ Service 1   │  │ Service 2   │  │ Service N  │
    │ (Streamlit) │  │ (Streamlit) │  │(Streamlit) │
    └──────┬──────┘  └──────┬──────┘  └─────┬──────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
                    ┌───────▼────────┐
                    │  API Gateway   │
                    │   (FastAPI)    │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼───────┐
│ Data Parser    │  │   Social    │  │   Monitoring   │
│    Service     │  │   Analyzer  │  │    Service     │
│   (Python)     │  │  Service    │  │   (Python)     │
└───────┬────────┘  └──────┬──────┘  └────────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Message Queue │
                    │   (RabbitMQ)   │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼───────┐
│  Redis Cache   │  │  PostgreSQL │  │  Object Store  │
│   (Shared)     │  │  (Metadata) │  │   (MinIO/S3)   │
└────────────────┘  └─────────────┘  └────────────────┘
```

## 🔧 Composants

### 1. API Gateway (FastAPI)

**Responsabilités**:
- Routing des requêtes
- Rate limiting
- Authentication/Authorization
- Request validation
- Response caching

**Endpoints**:
```
POST   /api/v1/parse         # Lancer parsing asynchrone
GET    /api/v1/parse/{id}    # Statut du parsing
GET    /api/v1/followers     # Liste des followers
GET    /api/v1/following     # Liste des following
GET    /api/v1/posts         # Liste des posts
GET    /api/v1/analytics     # Métriques d'analyse
GET    /api/v1/health        # Health check
```

### 2. Data Parser Service

**Responsabilités**:
- Parsing des données Instagram
- Support multi-format (JSON/HTML)
- Validation des données
- Storage dans PostgreSQL

**Technologies**:
- Python 3.9+
- Celery pour tâches asynchrones
- RabbitMQ comme message broker

### 3. Social Analyzer Service

**Responsabilités**:
- Analyse des relations sociales
- Détection followers inactifs
- Calcul métriques d'engagement
- Génération insights

### 4. Monitoring Service

**Responsabilités**:
- Collecte métriques système
- Alerting
- Logs centralisés
- Dashboards temps réel

### 5. Cache distribué (Redis)

**Configuration**:
```
- Redis Cluster (3 master, 3 slave)
- TTL: 1 heure (configurable)
- Eviction: LRU
- Persistence: RDB + AOF
```

### 6. Base de données (PostgreSQL)

**Schema**:
```sql
-- Utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    instagram_username VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Followers
CREATE TABLE followers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    follower_username VARCHAR(255),
    date_found TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    post_type VARCHAR(50),
    caption TEXT,
    created_at TIMESTAMP,
    engagement_rate FLOAT
);

-- Analytics cache
CREATE TABLE analytics_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    cache_key VARCHAR(255),
    data JSONB,
    expires_at TIMESTAMP
);
```

### 7. Object Storage (MinIO/S3)

**Buckets**:
```
instagram-data/          # Données brutes
instagram-exports/       # Exports générés
instagram-media/         # Médias (images/videos)
instagram-backups/       # Sauvegardes
```

## 📦 Déploiement avec Docker Compose

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/instagram
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
    depends_on:
      - redis
      - postgres
      - rabbitmq
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # Frontend (Streamlit)
  frontend:
    build: .
    ports:
      - "8501:8501"
    environment:
      - API_GATEWAY_URL=http://api-gateway:8000
    depends_on:
      - api-gateway
    deploy:
      replicas: 3

  # Data Parser Service
  data-parser:
    build: ./services/data-parser
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/instagram
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
    depends_on:
      - redis
      - postgres
      - rabbitmq
    deploy:
      replicas: 5

  # Social Analyzer Service
  social-analyzer:
    build: ./services/social-analyzer
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/instagram
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 3

  # Monitoring Service
  monitoring:
    build: ./services/monitoring
    ports:
      - "9090:9090"
    environment:
      - PROMETHEUS_URL=http://prometheus:9090
      - GRAFANA_URL=http://grafana:3000
    depends_on:
      - prometheus
      - grafana

  # Redis Cluster
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          memory: 2G

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=instagram
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

  # MinIO (S3 compatible)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data

  # Prometheus
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  # Grafana
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  redis-data:
  postgres-data:
  rabbitmq-data:
  minio-data:
  prometheus-data:
  grafana-data:

networks:
  default:
    driver: bridge
```

## 🔐 Sécurité

### Rate Limiting

```python
# api-gateway/middleware/rate_limit.py
from fastapi import Request
from redis import Redis
import time

class RateLimiter:
    def __init__(self, redis: Redis, max_requests: int = 100, window: int = 60):
        self.redis = redis
        self.max_requests = max_requests
        self.window = window
    
    async def check_rate_limit(self, request: Request) -> bool:
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        current = self.redis.get(key)
        if current is None:
            self.redis.setex(key, self.window, 1)
            return True
        
        if int(current) >= self.max_requests:
            return False
        
        self.redis.incr(key)
        return True
```

### Authentication JWT

```python
# api-gateway/auth/jwt.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## 📊 Observabilité

### Metrics (Prometheus)

```python
# services/common/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Compteurs
requests_total = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
errors_total = Counter('errors_total', 'Total errors', ['service', 'error_type'])

# Histogrammes
request_duration = Histogram('request_duration_seconds', 'Request duration', ['method', 'endpoint'])
parsing_duration = Histogram('parsing_duration_seconds', 'Parsing duration', ['data_type'])

# Gauges
active_users = Gauge('active_users', 'Active users')
cache_size = Gauge('cache_size_bytes', 'Cache size in bytes')
```

### Tracing (Jaeger)

```python
# services/common/tracing.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider

def setup_tracing(service_name: str):
    trace.set_tracer_provider(TracerProvider())
    tracer = trace.get_tracer(__name__)
    
    jaeger_exporter = JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )
    
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )
    
    return tracer
```

## 🚀 Performance

### Optimisations

1. **Caching agressif**
   - Redis pour données chaudes
   - CDN pour assets statiques
   - Browser caching

2. **Database optimization**
   - Index sur colonnes fréquentes
   - Connection pooling
   - Read replicas

3. **Async processing**
   - Celery pour tâches longues
   - RabbitMQ pour queuing
   - Webhooks pour notifications

4. **Load balancing**
   - Round-robin pour distribution
   - Health checks
   - Session affinity si nécessaire

### Benchmarks attendus

- **Throughput**: 1000 req/s
- **Latency p50**: < 500ms
- **Latency p99**: < 2s
- **Concurrent users**: 10,000+

## 📈 Scaling Stratégies

### Horizontal Scaling

```bash
# Kubernetes auto-scaling
kubectl autoscale deployment instagram-analytics \
  --min=3 --max=20 --cpu-percent=70
```

### Vertical Scaling

```yaml
# Augmenter ressources
resources:
  requests:
    memory: "4Gi"
    cpu: "2000m"
  limits:
    memory: "8Gi"
    cpu: "4000m"
```

### Database Scaling

- **Read replicas**: Pour queries READ
- **Sharding**: Par user_id
- **Partitioning**: Par date

---

## 🛠️ Maintenance

### Backup automatisé

```bash
# Cron job quotidien
0 2 * * * pg_dump instagram > /backups/instagram_$(date +\%Y\%m\%d).sql
```

### Rolling updates

```bash
# K8s rolling update
kubectl set image deployment/instagram-analytics \
  instagram-analytics=instagram-analytics:v1.1.0 \
  --record
```

### Disaster Recovery

- **RTO**: < 1 heure
- **RPO**: < 15 minutes
- **Backup retention**: 30 jours

---

**Architecture conçue pour**: Production-ready, scalable, resilient ✅
