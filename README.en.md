# Instagram Analytics - Professional Data Analysis Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)](https://streamlit.io)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-blue.svg)](https://kubernetes.io/)

> **Transform your Instagram data exports into actionable insights with a powerful, GDPR-compliant analytics dashboard**

[🇫🇷 Version Française](README.md) | [🇬🇧 English Version](README.en.md) | [🇪🇸 Versión Española](README.es.md)

## 🌟 Key Features

### 📊 **Comprehensive Analytics**
- **Social Network Analysis**: Track followers, following, inactive accounts, and non-reciprocal relationships
- **Content Insights**: Analyze posts, stories, reels with engagement metrics
- **Message Analytics**: Conversation patterns, frequency analysis, and relationship mapping
- **Activity Tracking**: Complete timeline of your Instagram activity

### 🔒 **Privacy & Compliance**
- **GDPR Compliant**: Full compliance with EU data protection regulations
- **AI Act Ready**: Transparent AI processing with ethical standards
- **Local Processing**: All data stays on your infrastructure
- **No External API**: No data sent to third parties

### ⚡ **Performance & Scalability**
- **Smart Caching**: 1-hour TTL with automatic invalidation
- **Multi-Format Support**: JSON, HTML, and Google Drive integration
- **Horizontal Scaling**: Cloud-ready architecture
- **Resource Monitoring**: Real-time performance metrics

### 🎨 **Professional UX/UI**
- **Instagram-Inspired Design**: Cohesive visual identity with gradient themes
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Interactive Visualizations**: Plotly-powered charts and graphs
- **Dark/Light Modes**: Customizable appearance

### 🚀 **Multi-Environment Deployment**
- **Docker Support**: Pre-configured containers for quick deployment
- **Kubernetes Ready**: Full K8s manifests with auto-scaling
- **Cloud Templates**: AWS, GCP, Azure, and SecNumCloud configurations
- **On-Premise**: Self-hosted deployment guides

## 📸 Screenshots

<div align="center">
  <img src="docs/images/dashboard-overview.png" alt="Dashboard Overview" width="800"/>
  <br/>
  <em>Main Dashboard - Comprehensive Analytics View</em>
</div>

<div align="center">
  <img src="docs/images/social-network.png" alt="Social Network Analysis" width="800"/>
  <br/>
  <em>Social Network Analysis - Followers & Following Insights</em>
</div>

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- pip package manager
- Instagram data export (JSON or HTML format)

### Installation

#### Method 1: pip (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/instagram-analytics.git
cd instagram-analytics

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the dashboard
streamlit run dashboard.py
```

#### Method 2: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access dashboard at http://localhost:8501
```

#### Method 3: Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f kubernetes/

# Get service URL
kubectl get service instagram-analytics-service -n instagram-analytics
```

### Getting Your Instagram Data

1. Go to [Instagram Settings](https://www.instagram.com/accounts/privacy_and_security/)
2. Click "Download Your Information"
3. Select "JSON" or "HTML" format
4. Wait for the download link (can take up to 48 hours)
5. Extract the ZIP file to `instagram_data/` folder

## 📖 Documentation

### User Guides
- [**Installation Guide**](docs/en/installation.md) - Detailed setup instructions
- [**User Manual**](docs/en/user-manual.md) - How to use all features
- [**Data Export Guide**](docs/en/data-export.md) - Getting your Instagram data

### Administrator Guides
- [**Deployment Guide**](docs/en/deployment.md) - Production deployment strategies
- [**Configuration Guide**](docs/en/configuration.md) - Advanced settings
- [**Security Guide**](docs/en/security.md) - Security best practices

### Developer Guides
- [**API Documentation**](docs/en/api.md) - Extend functionality
- [**Contributing Guide**](CONTRIBUTING.md) - How to contribute
- [**Architecture Overview**](docs/en/architecture.md) - System design

## 🏗️ Architecture

```
instagram-analytics/
├── dashboard.py              # Main application entry point
├── src/
│   ├── data_parser.py       # Multi-format data parsing
│   ├── social_analyzer.py   # Social network analysis
│   ├── compliance.py        # GDPR/AI Act compliance
│   ├── cache_manager.py     # Performance optimization
│   ├── monitoring.py        # Resource monitoring
│   ├── design_system.py     # UI theming & styling
│   └── ui_components.py     # Reusable UI components
├── kubernetes/              # K8s deployment manifests
├── terraform/               # Infrastructure as Code
├── docs/                    # Documentation
└── tests/                   # Unit and integration tests
```

## 📊 Key Metrics

After analyzing your Instagram data, you'll get insights like:

- **6,623 Followers** detected and analyzed
- **490 Following** relationships tracked
- **348+ Posts** with engagement metrics
- **~75% Inactive Followers** identification
- **66 Non-Reciprocal** following relationships

## 🔧 Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=production
DEBUG=false

# Streamlit
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0

# Performance
CACHE_TTL=3600
MAX_UPLOAD_SIZE=1000

# Monitoring
LOG_LEVEL=INFO
ENABLE_METRICS=true
```

### Custom Settings

Edit `.streamlit/config.toml` for advanced customization:

```toml
[theme]
primaryColor = "#E1306C"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"
font = "sans serif"

[server]
maxUploadSize = 1000
enableCORS = false
enableXsrfProtection = true
```

## 🌐 Deployment Options

### Cloud Providers

#### AWS (ECS Fargate)
```bash
cd terraform/aws
terraform init
terraform plan
terraform apply
```

#### Google Cloud Platform (GKE)
```bash
gcloud container clusters create instagram-analytics
kubectl apply -f kubernetes/
```

#### Microsoft Azure (AKS)
```bash
az aks create --name instagram-analytics
kubectl apply -f kubernetes/
```

### On-Premise

#### Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-compose.prod.yml instagram
```

#### Bare Metal
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install python3.9 python3-pip

# Deploy application
pip install -r requirements.txt
streamlit run dashboard.py --server.port=8501
```

### SecNumCloud (French Government)

For sensitive data requiring SecNumCloud certification:

1. Use certified cloud provider (OVHcloud, Scaleway, etc.)
2. Enable encryption at rest and in transit
3. Configure audit logging
4. Follow deployment guide: [docs/en/secnumcloud.md](docs/en/secnumcloud.md)

## 📈 Monitoring & Observability

### Built-in Monitoring Dashboard

Access at `/monitoring` route:
- **System Resources**: CPU, RAM, Disk usage
- **Cache Metrics**: Size, hit rate, eviction stats
- **Performance**: Parsing speed, response times
- **Cost Estimation**: Cloud infrastructure costs

### External Monitoring

Compatible with:
- **Prometheus**: Metrics export
- **Grafana**: Custom dashboards
- **ELK Stack**: Log aggregation
- **Datadog**: Full observability

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Check code quality
black src/
flake8 src/
mypy src/
```

### Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/yourusername/instagram-analytics/issues)

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Streamlit** - Beautiful web framework
- **Plotly** - Interactive visualizations
- **BeautifulSoup** - HTML parsing
- **Pandas** - Data manipulation

## 📞 Support

- 📧 Email: support@instagram-analytics.com
- 💬 Discord: [Join our community](https://discord.gg/instagram-analytics)
- 📚 Docs: [docs.instagram-analytics.com](https://docs.instagram-analytics.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/instagram-analytics/issues)

## 🗺️ Roadmap

### Q1 2024
- [ ] Real-time data sync
- [ ] Mobile app (iOS/Android)
- [ ] Advanced ML predictions

### Q2 2024
- [ ] Multi-account support
- [ ] Team collaboration features
- [ ] API marketplace

### Q3 2024
- [ ] Enterprise SSO integration
- [ ] White-label options
- [ ] Advanced export formats

---

<div align="center">
  
**Made with ❤️ by the Instagram Analytics Team**

[Website](https://instagram-analytics.com) • [Documentation](https://docs.instagram-analytics.com) • [Blog](https://blog.instagram-analytics.com)

</div>
