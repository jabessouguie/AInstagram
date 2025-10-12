#!/usr/bin/env python3
"""
Script de lancement pour le Instagram Analytics Dashboard
"""

import os
import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Vérifie que Python 3.8+ est installé"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 ou plus récent est requis.")
        print(f"Version actuelle: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} détecté")


def install_requirements():
    """Installe les dépendances requises"""
    requirements_file = Path("requirements.txt")
    if not requirements_file.exists():
        print("❌ Le fichier requirements.txt est introuvable.")
        sys.exit(1)
    
    print("📦 Installation des dépendances...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dépendances installées avec succès")
    except subprocess.CalledProcessError:
        print("❌ Erreur lors de l'installation des dépendances")
        print("Essayez d'exécuter manuellement: pip install -r requirements.txt")
        sys.exit(1)


def check_data_folder():
    """Vérifie la présence du dossier de données"""
    data_folder = Path("instagram_data")
    if not data_folder.exists():
        print("⚠️  Le dossier 'instagram_data' n'existe pas.")
        print("📝 Instructions:")
        print("1. Exportez vos données Instagram depuis votre compte")
        print("2. Décompressez le fichier ZIP obtenu")
        print("3. Créez un dossier 'instagram_data' dans ce répertoire")
        print("4. Placez le(s) dossier(s) 'instagram-*' dans 'instagram_data'")
        
        # Créer le dossier vide
        data_folder.mkdir(exist_ok=True)
        print(f"✅ Dossier 'instagram_data' créé dans {data_folder.absolute()}")
        return False
    
    # Vérifier s'il y a des données
    instagram_folders = list(data_folder.glob("instagram-*"))
    if not instagram_folders:
        print("⚠️  Aucun dossier de données Instagram trouvé dans 'instagram_data'")
        print("Placez vos dossiers d'export Instagram (instagram-*) dans ce dossier.")
        return False
    
    print(f"✅ {len(instagram_folders)} dossier(s) de données Instagram trouvé(s)")
    return True


def launch_dashboard():
    """Lance le dashboard Streamlit"""
    print("🚀 Lancement du dashboard...")
    print("📊 Le dashboard va s'ouvrir dans votre navigateur à l'adresse:")
    print("   http://localhost:8501")
    print("\n⏹️  Pour arrêter le dashboard, utilisez Ctrl+C dans ce terminal")
    print("=" * 60)
    
    try:
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", "dashboard.py",
            "--server.port", "8501",
            "--server.headless", "false",
            "--browser.gatherUsageStats", "false"
        ])
    except KeyboardInterrupt:
        print("\n👋 Dashboard arrêté par l'utilisateur")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du lancement: {e}")
        sys.exit(1)


def main():
    """Fonction principale"""
    print("🎯 Instagram Analytics Dashboard")
    print("=" * 40)
    
    # Vérifications préalables
    check_python_version()
    
    # Vérifier si les dépendances sont installées
    try:
        import streamlit
        print("✅ Streamlit est installé")
    except ImportError:
        print("📦 Installation des dépendances requise...")
        install_requirements()
    
    # Vérifier les données
    has_data = check_data_folder()
    
    if not has_data:
        response = input("\n❓ Voulez-vous lancer le dashboard quand même ? (y/N): ")
        if response.lower() not in ['y', 'yes', 'oui', 'o']:
            print("👋 À bientôt ! Ajoutez vos données et relancez le script.")
            return
    
    # Lancer le dashboard
    print("\n" + "=" * 40)
    launch_dashboard()


if __name__ == "__main__":
    main()