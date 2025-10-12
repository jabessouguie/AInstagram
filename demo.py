#!/usr/bin/env python3
"""
Script de démonstration complète de l'Instagram Analytics Dashboard
"""

import os
import subprocess
import time
import webbrowser
from pathlib import Path


def check_dependencies():
    """Vérifie que toutes les dépendances sont installées"""
    print("🔍 Vérification des dépendances...")
    
    required_packages = [
        'streamlit', 'pandas', 'plotly', 'beautifulsoup4',
        'numpy', 'matplotlib', 'seaborn', 'wordcloud', 
        'watchdog', 'lxml'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"  ✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"  ❌ {package}")
    
    if missing_packages:
        print(f"\n⚠️ Packages manquants: {', '.join(missing_packages)}")
        print("Installez-les avec: pip install -r requirements.txt")
        return False
    
    print("\n✅ Toutes les dépendances sont installées !")
    return True


def check_data_folder():
    """Vérifie la présence du dossier de données Instagram"""
    print("\n📂 Vérification des données Instagram...")
    
    data_folder = Path("instagram_data")
    
    if not data_folder.exists():
        print("❌ Dossier 'instagram_data' non trouvé")
        print("\n📝 Instructions :")
        print("1. Exportez vos données Instagram depuis votre compte")
        print("2. Décompressez le fichier ZIP obtenu")
        print("3. Placez le(s) dossier(s) 'instagram-*' dans un dossier 'instagram_data'")
        return False
    
    instagram_folders = list(data_folder.glob("instagram-*"))
    
    if not instagram_folders:
        print("❌ Aucun dossier 'instagram-*' trouvé dans 'instagram_data'")
        return False
    
    print(f"✅ {len(instagram_folders)} dossier(s) de données trouvé(s)")
    for folder in instagram_folders[:3]:  # Affiche les 3 premiers
        print(f"  📁 {folder.name}")
    
    if len(instagram_folders) > 3:
        print(f"  ... et {len(instagram_folders) - 3} autres")
    
    return True


def test_parser():
    """Test rapide du parser"""
    print("\n🧪 Test rapide du parser...")
    
    try:
        from src.data_parser import InstagramDataParser
        
        parser = InstagramDataParser("instagram_data", use_threading=True)
        
        # Parse seulement un échantillon pour le test
        start_time = time.time()
        data = parser.parse_all_data()
        parse_time = time.time() - start_time
        
        print(f"  ⏱️ Temps de parsing: {parse_time:.2f}s")
        print(f"  📊 Données parsées:")
        
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 0:
                print(f"    {key}: {len(value)} éléments")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False


def launch_dashboard():
    """Lance le dashboard Streamlit"""
    print("\n🚀 Lancement du dashboard...")
    
    try:
        # Vérifier si Streamlit est déjà en cours
        subprocess.run(['pkill', '-f', 'streamlit'], capture_output=True)
        time.sleep(1)
        
        # Lancer Streamlit
        cmd = ['streamlit', 'run', 'dashboard.py', '--server.port', '8501']
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print("⏳ Démarrage en cours...")
        time.sleep(5)  # Attendre que Streamlit démarre
        
        # Ouvrir le navigateur
        dashboard_url = "http://localhost:8501"
        print(f"🌐 Ouverture de {dashboard_url}")
        
        try:
            webbrowser.open(dashboard_url)
        except:
            print("⚠️ Impossible d'ouvrir automatiquement le navigateur")
            print(f"Ouvrez manuellement: {dashboard_url}")
        
        return process
        
    except Exception as e:
        print(f"❌ Erreur lors du lancement: {e}")
        return None


def main():
    """Fonction principale de démonstration"""
    print("🎯 Instagram Analytics Dashboard - Démonstration")
    print("=" * 60)
    
    # Vérifications préalables
    if not check_dependencies():
        return
    
    if not check_data_folder():
        return
    
    # Test du parser
    if not test_parser():
        print("⚠️ Le parser rencontre des problèmes, mais le dashboard peut fonctionner")
    
    # Lancement du dashboard
    process = launch_dashboard()
    
    if process:
        print("\n✅ Dashboard lancé avec succès !")
        print("\n📊 Fonctionnalités disponibles :")
        print("  📈 Vue d'ensemble - Métriques principales")
        print("  💬 Messages - Analyse des conversations")
        print("  👥 Connexions - Followers et Following")
        print("  📸 Posts & Médias - Posts, Stories, Reels")
        print("  🎯 Activité - Likes, Recherches, Publicités")
        
        print("\n🎛️ Fonctionnalités avancées :")
        print("  ⚡ Threading - Parsing accéléré")
        print("  👁️ Watchdog - Surveillance des fichiers")
        print("  📱 Interface responsive")
        print("  🔒 100% local et sécurisé")
        
        print("\n💡 Conseils d'utilisation :")
        print("  • Naviguez entre les sections via la barre latérale")
        print("  • Les graphiques sont interactifs (zoom, filtres)")
        print("  • Toutes vos données restent sur votre machine")
        print("  • Le parsing s'améliore avec plus de données")
        
        print(f"\n🌐 Dashboard disponible sur: http://localhost:8501")
        print("\n⌨️ Appuyez sur Ctrl+C pour arrêter")
        
        try:
            process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Arrêt du dashboard...")
            process.terminate()
            subprocess.run(['pkill', '-f', 'streamlit'], capture_output=True)
            print("✅ Dashboard arrêté")
    
    else:
        print("❌ Impossible de lancer le dashboard")
        print("\nEssayez manuellement :")
        print("  streamlit run dashboard.py")


if __name__ == "__main__":
    main()