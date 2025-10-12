@echo off
echo 🎯 Instagram Analytics Dashboard
echo =====================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou pas dans le PATH
    echo Veuillez installer Python 3.8+ depuis https://python.org
    pause
    exit /b 1
)

REM Installer les dépendances si nécessaire
echo 📦 Vérification des dépendances...
python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo Installation des dépendances...
    python -m pip install -r requirements.txt
)

REM Lancer le script principal
python run.py

pause