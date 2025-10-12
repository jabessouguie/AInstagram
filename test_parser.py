#!/usr/bin/env python3
"""
Script de test pour le parser Instagram avec les nouvelles fonctionnalités
"""
import time
from src.data_parser import InstagramDataParser


def test_parser_performance():
    """Test des performances du parser"""
    print("🧪 Test du parser Instagram Analytics")
    print("=" * 50)
    
    # Test sans threading
    print("\n1️⃣ Test sans threading...")
    start_time = time.time()
    parser_simple = InstagramDataParser("instagram_data", use_threading=False)
    data_simple = parser_simple.parse_all_data()
    time_simple = time.time() - start_time
    
    print(f"  ⏱️ Temps: {time_simple:.2f}s")
    print(f"  📊 Données parsées:")
    for key, value in data_simple.items():
        if isinstance(value, list):
            print(f"    {key}: {len(value)} éléments")
    
    # Test avec threading
    print("\n2️⃣ Test avec threading...")
    start_time = time.time()
    parser_threaded = InstagramDataParser("instagram_data", use_threading=True)
    data_threaded = parser_threaded.parse_all_data()
    time_threaded = time.time() - start_time
    
    print(f"  ⏱️ Temps: {time_threaded:.2f}s")
    print(f"  📊 Données parsées:")
    for key, value in data_threaded.items():
        if isinstance(value, list):
            print(f"    {key}: {len(value)} éléments")
    
    # Comparaison
    improvement = ((time_simple - time_threaded) / time_simple) * 100 if time_simple > 0 else 0
    print(f"\n🚀 Amélioration des performances: {improvement:.1f}%")
    
    # Test des DataFrames
    print("\n3️⃣ Test des DataFrames...")
    dataframes = parser_threaded.to_dataframes()
    print("  📋 DataFrames créés:")
    for name, df in dataframes.items():
        if len(df) > 0:
            print(f"    {name}: {len(df)} lignes, {len(df.columns)} colonnes")
            print(f"      Colonnes: {', '.join(df.columns[:5])}{'...' if len(df.columns) > 5 else ''}")
    
    # Test de la surveillance (rapide)
    print("\n4️⃣ Test de la surveillance des fichiers...")
    parser_watcher = InstagramDataParser("instagram_data", use_threading=True)
    parser_watcher.start_watching()
    print("  👁️ Surveillance démarrée")
    time.sleep(2)  # Attendre 2 secondes
    parser_watcher.stop_watching()
    print("  🛑 Surveillance arrêtée")
    
    print(f"\n✅ Tests terminés avec succès!")
    print(f"📊 Résumé:")
    print(f"  - Parsing simple: {time_simple:.2f}s")
    print(f"  - Parsing threadé: {time_threaded:.2f}s") 
    print(f"  - Amélioration: {improvement:.1f}%")
    print(f"  - Types de données: {len([k for k, v in data_threaded.items() if isinstance(v, list) and len(v) > 0])}")


if __name__ == "__main__":
    test_parser_performance()