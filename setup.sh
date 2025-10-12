#!/bin/bash
# setup.sh - Script d'initialisation Instagram Analytics
# Usage: ./setup.sh [dev|prod]

set -e

COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'

echo -e "${COLOR_BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗███╗   ██╗███████╗████████╗ █████╗  ██████╗ ██████╗ ║
║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝ ██╔══██╗║
║   ██║██╔██╗ ██║███████╗   ██║   ███████║██║  ███╗██████╔╝║
║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║   ██║██╔══██╗║
║   ██║██║ ╚████║███████║   ██║   ██║  ██║╚██████╔╝██║  ██║║
║   ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝║
║                                                           ║
║              A N A L Y T I C S   S E T U P               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${COLOR_RESET}"

MODE=${1:-dev}

echo -e "${COLOR_GREEN}🚀 Starting Instagram Analytics setup (${MODE} mode)...${COLOR_RESET}\n"

# Check prerequisites
echo -e "${COLOR_BLUE}📋 Checking prerequisites...${COLOR_RESET}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${COLOR_RED}❌ Python 3 is not installed${COLOR_RESET}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${COLOR_GREEN}✅ Python ${PYTHON_VERSION}${COLOR_RESET}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${COLOR_RED}❌ pip is not installed${COLOR_RESET}"
    exit 1
fi
echo -e "${COLOR_GREEN}✅ pip installed${COLOR_RESET}"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    echo -e "${COLOR_GREEN}✅ Docker ${DOCKER_VERSION}${COLOR_RESET}"
else
    echo -e "${COLOR_YELLOW}⚠️  Docker not found (optional)${COLOR_RESET}"
fi

echo ""

# Create virtual environment
echo -e "${COLOR_BLUE}🐍 Creating virtual environment...${COLOR_RESET}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${COLOR_GREEN}✅ Virtual environment created${COLOR_RESET}"
else
    echo -e "${COLOR_YELLOW}⚠️  Virtual environment already exists${COLOR_RESET}"
fi

# Activate virtual environment
echo -e "${COLOR_BLUE}🔌 Activating virtual environment...${COLOR_RESET}"
source venv/bin/activate
echo -e "${COLOR_GREEN}✅ Virtual environment activated${COLOR_RESET}\n"

# Upgrade pip
echo -e "${COLOR_BLUE}⬆️  Upgrading pip...${COLOR_RESET}"
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
echo -e "${COLOR_GREEN}✅ pip upgraded${COLOR_RESET}\n"

# Install dependencies
if [ "$MODE" == "dev" ]; then
    echo -e "${COLOR_BLUE}📦 Installing development dependencies...${COLOR_RESET}"
    pip install -r requirements-dev.txt
    echo -e "${COLOR_GREEN}✅ Development dependencies installed${COLOR_RESET}\n"
else
    echo -e "${COLOR_BLUE}📦 Installing production dependencies...${COLOR_RESET}"
    pip install -r requirements.txt
    echo -e "${COLOR_GREEN}✅ Production dependencies installed${COLOR_RESET}\n"
fi

# Create necessary directories
echo -e "${COLOR_BLUE}📁 Creating directories...${COLOR_RESET}"
mkdir -p instagram_data
mkdir -p .cache
mkdir -p logs
echo -e "${COLOR_GREEN}✅ Directories created${COLOR_RESET}\n"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${COLOR_BLUE}⚙️  Creating .env file...${COLOR_RESET}"
    cat > .env << 'ENVFILE'
# Instagram Analytics Configuration

# Environment
ENVIRONMENT=development
DEBUG=true

# Streamlit
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0
STREAMLIT_SERVER_HEADLESS=true

# Performance
CACHE_TTL=3600
MAX_UPLOAD_SIZE=1000

# Monitoring
LOG_LEVEL=INFO
ENABLE_METRICS=true
ENVFILE
    echo -e "${COLOR_GREEN}✅ .env file created${COLOR_RESET}\n"
else
    echo -e "${COLOR_YELLOW}⚠️  .env file already exists${COLOR_RESET}\n"
fi

# Run tests in dev mode
if [ "$MODE" == "dev" ]; then
    echo -e "${COLOR_BLUE}🧪 Running tests...${COLOR_RESET}"
    if pytest tests/ -v --tb=short 2>/dev/null; then
        echo -e "${COLOR_GREEN}✅ All tests passed${COLOR_RESET}\n"
    else
        echo -e "${COLOR_YELLOW}⚠️  Some tests failed (continuing anyway)${COLOR_RESET}\n"
    fi
fi

# Summary
echo -e "${COLOR_GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                    ✨ SETUP COMPLETE ✨                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${COLOR_RESET}"

echo -e "${COLOR_BLUE}📚 Next steps:${COLOR_RESET}\n"

if [ "$MODE" == "dev" ]; then
    echo -e "  1. Place your Instagram data in ${COLOR_YELLOW}instagram_data/${COLOR_RESET}"
    echo -e "  2. Run the dashboard: ${COLOR_YELLOW}streamlit run dashboard.py${COLOR_RESET}"
    echo -e "  3. Open your browser: ${COLOR_YELLOW}http://localhost:8501${COLOR_RESET}"
    echo -e "\n${COLOR_BLUE}Development commands:${COLOR_RESET}"
    echo -e "  • ${COLOR_YELLOW}make dev${COLOR_RESET}          - Start development server"
    echo -e "  • ${COLOR_YELLOW}make test${COLOR_RESET}         - Run tests"
    echo -e "  • ${COLOR_YELLOW}make lint${COLOR_RESET}         - Check code quality"
    echo -e "  • ${COLOR_YELLOW}make format${COLOR_RESET}       - Format code"
else
    echo -e "  1. Place your Instagram data in ${COLOR_YELLOW}instagram_data/${COLOR_RESET}"
    echo -e "  2. Build Docker image: ${COLOR_YELLOW}make docker-build${COLOR_RESET}"
    echo -e "  3. Run container: ${COLOR_YELLOW}make docker-run${COLOR_RESET}"
    echo -e "\n${COLOR_BLUE}Production commands:${COLOR_RESET}"
    echo -e "  • ${COLOR_YELLOW}make docker-compose-prod${COLOR_RESET} - Deploy with Docker Compose"
    echo -e "  • ${COLOR_YELLOW}make deploy-k8s${COLOR_RESET}          - Deploy to Kubernetes"
    echo -e "  • ${COLOR_YELLOW}make deploy-aws${COLOR_RESET}          - Deploy to AWS"
fi

echo -e "\n${COLOR_BLUE}Documentation:${COLOR_RESET}"
echo -e "  • README: ${COLOR_YELLOW}README.md${COLOR_RESET}"
echo -e "  • Deployment Guide: ${COLOR_YELLOW}docs/DEPLOYMENT.md${COLOR_RESET}"
echo -e "  • Architecture: ${COLOR_YELLOW}docs/ARCHITECTURE.md${COLOR_RESET}"

echo -e "\n${COLOR_BLUE}Support:${COLOR_RESET}"
echo -e "  • 📧 Email: ${COLOR_YELLOW}support@instagram-analytics.com${COLOR_RESET}"
echo -e "  • 💬 Discord: ${COLOR_YELLOW}https://discord.gg/instagram-analytics${COLOR_RESET}"
echo -e "  • 📚 Docs: ${COLOR_YELLOW}https://docs.instagram-analytics.com${COLOR_RESET}"

echo -e "\n${COLOR_GREEN}Happy analyzing! 🎉${COLOR_RESET}\n"
