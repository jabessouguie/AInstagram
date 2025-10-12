# 🚀 Guide de Déploiement - Instagram Analytics

Ce guide couvre tous les scénarios de déploiement pour Instagram Analytics.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Déploiement Local](#déploiement-local)
3. [Déploiement Docker](#déploiement-docker)
4. [Déploiement Kubernetes](#déploiement-kubernetes)
5. [Déploiement Cloud](#déploiement-cloud)
6. [Déploiement SecNumCloud](#déploiement-secnumcloud)
7. [Monitoring et Maintenance](#monitoring-et-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prérequis

### Pour tous les déploiements
- Données Instagram exportées (JSON ou HTML)
- Accès administrateur au système cible

### Selon le type de déploiement
- **Local**: Python 3.9+, pip
- **Docker**: Docker 20+, Docker Compose
- **Kubernetes**: kubectl, cluster K8s
- **Cloud**: Compte cloud (AWS/GCP/Azure)
- **SecNumCloud**: Fournisseur certifié (OVH, Scaleway, etc.)

---

## Déploiement Local

### Installation Standard

```bash
# 1. Cloner le repository
git clone https://github.com/yourusername/instagram-analytics.git
cd instagram-analytics

# 2. Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Installer dépendances
pip install -r requirements.txt

# 4. Configurer l'application
cp .env.example .env
# Éditer .env avec vos paramètres

# 5. Lancer l'application
streamlit run dashboard.py
```

L'application sera accessible à `http://localhost:8501`

### Installation avec PyPI (à venir)

```bash
pip install instagram-analytics
instagram-analytics --port 8501
```

---

## Déploiement Docker

### Option 1: Docker Compose (Recommandé)

#### Développement

```bash
# Lancer en mode développement
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

#### Production

```bash
# Build l'image optimisée
docker-compose -f docker-compose.prod.yml build

# Lancer en production
docker-compose -f docker-compose.prod.yml up -d

# Vérifier le statut
docker-compose -f docker-compose.prod.yml ps
```

### Option 2: Docker Manuel

```bash
# Build l'image
docker build -t instagram-analytics:latest -f Dockerfile.prod .

# Créer les volumes
docker volume create instagram-data
docker volume create instagram-cache

# Lancer le container
docker run -d \
  --name instagram-analytics \
  -p 8501:8501 \
  -v instagram-data:/app/instagram_data \
  -v instagram-cache:/app/.cache \
  -e ENVIRONMENT=production \
  --restart unless-stopped \
  instagram-analytics:latest

# Vérifier les logs
docker logs -f instagram-analytics
```

### Configuration Docker

#### Variables d'environnement

```bash
# .env pour Docker
ENVIRONMENT=production
DEBUG=false
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0
LOG_LEVEL=INFO
CACHE_TTL=3600
```

#### Ressources

```yaml
# docker-compose.prod.yml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
    reservations:
      cpus: '1.0'
      memory: 2G
```

---

## Déploiement Kubernetes

### Prérequis

```bash
# Vérifier kubectl
kubectl version --client

# Vérifier accès au cluster
kubectl cluster-info
```

### Déploiement

```bash
# 1. Créer le namespace
kubectl create namespace instagram-analytics

# 2. Appliquer les configurations
kubectl apply -f kubernetes/deployment.yaml

# 3. Vérifier le déploiement
kubectl get pods -n instagram-analytics
kubectl get services -n instagram-analytics

# 4. Obtenir l'URL publique
kubectl get ingress -n instagram-analytics
```

### Configuration personnalisée

#### Modifier les ressources

```yaml
# kubernetes/deployment.yaml
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

#### Ajuster l'auto-scaling

```yaml
# kubernetes/deployment.yaml
spec:
  minReplicas: 2    # Minimum de pods
  maxReplicas: 10   # Maximum de pods
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Seuil CPU
```

### Monitoring Kubernetes

```bash
# Surveiller les pods
kubectl top pods -n instagram-analytics

# Voir les logs
kubectl logs -f deployment/instagram-analytics -n instagram-analytics

# Accéder au shell d'un pod
kubectl exec -it <pod-name> -n instagram-analytics -- /bin/bash

# Redémarrer le déploiement
kubectl rollout restart deployment/instagram-analytics -n instagram-analytics
```

---

## Déploiement Cloud

### AWS (ECS Fargate avec Terraform)

#### Configuration

```bash
# 1. Installer Terraform
brew install terraform  # macOS
# ou: https://www.terraform.io/downloads

# 2. Configurer AWS CLI
aws configure
# Entrer: Access Key, Secret Key, Region (eu-west-1)

# 3. Initialiser Terraform
cd terraform/aws
terraform init

# 4. Planifier le déploiement
terraform plan

# 5. Appliquer la configuration
terraform apply
# Répondre 'yes' pour confirmer

# 6. Obtenir les outputs
terraform output load_balancer_dns
terraform output ecr_repository_url
```

#### Push de l'image Docker vers ECR

```bash
# 1. Récupérer l'URL ECR
ECR_URL=$(terraform output -raw ecr_repository_url)

# 2. Authentification Docker avec ECR
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin $ECR_URL

# 3. Build et tag l'image
docker build -t instagram-analytics:latest -f Dockerfile.prod .
docker tag instagram-analytics:latest $ECR_URL:latest

# 4. Push vers ECR
docker push $ECR_URL:latest

# 5. Forcer le déploiement ECS
aws ecs update-service \
  --cluster instagram-analytics-cluster \
  --service instagram-analytics-service \
  --force-new-deployment
```

#### Estimation des coûts AWS

**Configuration Standard** (2 vCPU, 4GB RAM, 2 instances):
- ECS Fargate: ~$60-80/mois
- ALB: ~$20-25/mois
- ECR: ~$1-5/mois
- Data Transfer: ~$10-20/mois
- CloudWatch: ~$5-10/mois

**Total estimé**: $95-140/mois

### Google Cloud Platform (GKE)

```bash
# 1. Créer le cluster GKE
gcloud container clusters create instagram-analytics \
  --zone europe-west1-b \
  --num-nodes 2 \
  --machine-type n1-standard-2

# 2. Configurer kubectl
gcloud container clusters get-credentials instagram-analytics \
  --zone europe-west1-b

# 3. Déployer l'application
kubectl apply -f kubernetes/

# 4. Obtenir l'IP externe
kubectl get service instagram-analytics-service -n instagram-analytics
```

### Microsoft Azure (AKS)

```bash
# 1. Créer resource group
az group create \
  --name instagram-analytics-rg \
  --location westeurope

# 2. Créer le cluster AKS
az aks create \
  --resource-group instagram-analytics-rg \
  --name instagram-analytics-aks \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity

# 3. Configurer kubectl
az aks get-credentials \
  --resource-group instagram-analytics-rg \
  --name instagram-analytics-aks

# 4. Déployer
kubectl apply -f kubernetes/
```

---

## Déploiement SecNumCloud

### Contexte

SecNumCloud est une qualification de l'ANSSI (Agence Nationale de la Sécurité des Systèmes d'Information) garantissant un niveau élevé de sécurité pour les données sensibles.

### Fournisseurs certifiés

- **OVHcloud** - Cloud Public & Hosted Private Cloud
- **Scaleway** - C14 Cold Storage & Elements
- **Outscale** - 3DS OUTSCALE
- **Orange Business Services** - Flexible Engine

### Déploiement avec OVHcloud

```bash
# 1. Installer OVH CLI
pip install ovh

# 2. Configurer les credentials
# Créer application sur: https://eu.api.ovh.com/createApp/
ovh --init

# 3. Créer cluster Kubernetes
ovh kube create \
  --name instagram-analytics \
  --region GRA7 \
  --version 1.27

# 4. Récupérer kubeconfig
ovh kube kubeconfig <cluster-id> > ~/.kube/config-ovh

# 5. Déployer avec configurations SecNumCloud
export KUBECONFIG=~/.kube/config-ovh
kubectl apply -f kubernetes/
kubectl apply -f kubernetes/secnumcloud/
```

### Configuration SecNumCloud

#### Chiffrement obligatoire

```yaml
# kubernetes/secnumcloud/encryption.yaml
apiVersion: v1
kind: Secret
metadata:
  name: instagram-analytics-encryption
  namespace: instagram-analytics
type: Opaque
data:
  encryption-key: <base64-encoded-key>
```

#### Audit logs

```yaml
# kubernetes/secnumcloud/audit.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  resources:
  - group: ""
    resources: ["pods", "services"]
```

#### Network policies

```yaml
# kubernetes/secnumcloud/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: instagram-analytics-network
  namespace: instagram-analytics
spec:
  podSelector:
    matchLabels:
      app: instagram-analytics
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx
    ports:
    - protocol: TCP
      port: 8501
  egress:
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

---

## Monitoring et Maintenance

### Monitoring Intégré

Accédez au dashboard de monitoring:
```
http://your-domain.com/monitoring
```

Métriques disponibles:
- Utilisation CPU/RAM/Disque
- Métriques de cache
- Performances de parsing
- Estimation des coûts

### Prometheus + Grafana

```bash
# Installer Prometheus Operator
kubectl create namespace monitoring
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring

# Port-forward Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Accéder: http://localhost:3000
# Login: admin / prom-operator
```

### Logs centralisés (ELK Stack)

```bash
# Installer Elasticsearch
helm install elasticsearch elastic/elasticsearch -n monitoring

# Installer Kibana
helm install kibana elastic/kibana -n monitoring

# Installer Filebeat
helm install filebeat elastic/filebeat -n monitoring
```

### Alerting

```yaml
# alerting/rules.yaml
groups:
- name: instagram-analytics
  rules:
  - alert: HighCPUUsage
    expr: cpu_usage > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "CPU usage above 80%"
  
  - alert: HighMemoryUsage
    expr: memory_usage > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Memory usage above 85%"
```

---

## Troubleshooting

### Problèmes courants

#### Application ne démarre pas

```bash
# Vérifier les logs
docker logs instagram-analytics
# ou
kubectl logs -f deployment/instagram-analytics -n instagram-analytics

# Vérifier la configuration
streamlit run dashboard.py --logger.level=debug
```

#### Erreur de parsing

```bash
# Vérifier le format des données
python -c "from src.data_parser import InstagramDataParser; \
           parser = InstagramDataParser('instagram_data'); \
           parser.parse_all_folders()"
```

#### Performance dégradée

```bash
# Vider le cache
rm -rf .cache/*

# Augmenter les ressources (Docker)
docker update instagram-analytics --memory=4g --cpus=2

# Augmenter les ressources (K8s)
kubectl scale deployment instagram-analytics --replicas=3 -n instagram-analytics
```

#### Erreurs CORS

```yaml
# .streamlit/config.toml
[server]
enableCORS = true
enableXsrfProtection = false  # Uniquement en dev!
```

### Commandes utiles

#### Docker

```bash
# Recréer le container
docker-compose up -d --force-recreate

# Nettoyer les ressources
docker system prune -a --volumes

# Inspecter le container
docker inspect instagram-analytics
```

#### Kubernetes

```bash
# Redémarrer un pod
kubectl delete pod <pod-name> -n instagram-analytics

# Rollback un déploiement
kubectl rollout undo deployment/instagram-analytics -n instagram-analytics

# Scaler horizontalement
kubectl scale deployment instagram-analytics --replicas=5 -n instagram-analytics
```

#### Terraform

```bash
# Voir l'état
terraform show

# Détruire l'infrastructure
terraform destroy

# Importer ressource existante
terraform import aws_ecs_cluster.main <cluster-name>
```

---

## Checklist de Déploiement

### Pré-déploiement
- [ ] Vérifier les prérequis système
- [ ] Configurer les variables d'environnement
- [ ] Tester localement
- [ ] Préparer les données Instagram
- [ ] Configurer le monitoring
- [ ] Configurer les alertes

### Déploiement
- [ ] Build de l'image Docker
- [ ] Push vers registry (ECR/GCR/ACR)
- [ ] Appliquer les manifests K8s
- [ ] Vérifier les pods
- [ ] Tester les endpoints
- [ ] Configurer le DNS

### Post-déploiement
- [ ] Vérifier les métriques
- [ ] Tester toutes les fonctionnalités
- [ ] Configurer les sauvegardes
- [ ] Documenter la configuration
- [ ] Former les utilisateurs
- [ ] Plan de disaster recovery

---

## Support

- 📧 **Email**: support@instagram-analytics.com
- 💬 **Discord**: [Rejoindre la communauté](https://discord.gg/instagram-analytics)
- 📚 **Documentation**: [docs.instagram-analytics.com](https://docs.instagram-analytics.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/instagram-analytics/issues)

---

**Dernière mise à jour**: Janvier 2024  
**Version**: 1.0.0
