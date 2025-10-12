#!/bin/bash

echo "🎯 Instagram Analytics Dashboard"
echo "====================================="
echo

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    echo "Veuillez installer Python 3.8+ depuis https://python.org"
    exit 1
fi

# Vérifier la version de Python
python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Python 3.8+ est requis"
    python3 --version
    exit 1
fi

# Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
python3 -c "import streamlit" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installation des dépendances..."
    python3 -m pip install -r requirements.txt
fi

# Lancer le script principal
python3 run.py