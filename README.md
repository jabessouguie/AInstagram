# 🎯 Instagram Analytics Dashboard v2.0

Dashboard d'analyse Instagram 100% local, conforme RGPD et IA Act européen.

## 📊 Statistiques de Parsing (v2.0)
- 👥 **6,623 followers** détectés
- ➡️ **490 following** détectés  
- 📸 **348+ posts** analysés
- 👻 **~75% followers inactifs** identifiés
- 🔄 **66 suivis non réciproques** détectés

## Installation

1. Installez Python 3.9 ou plus récent
2. Installez les dépendances :
```bash
pip install -r requirements.txt
```

## Utilisation

1. Placez vos données Instagram exportées dans le dossier `instagram_data/`
2. Lancez le dashboard :
```bash
# Méthode recommandée : Démonstration complète
python demo.py

# Méthode 1 : Script de lancement automatique
python run.py

# Méthode 2 : Script batch (Windows)
run.bat

# Méthode 3 : Script shell (Mac/Linux)
./run.sh

# Méthode 4 : Lancement direct Streamlit
streamlit run dashboard.py

# Test des performances
python test_parser.py
```
3. Ouvrez votre navigateur à l'adresse http://localhost:8501

## ✨ Fonctionnalités v2.0

### 📊 Analyses complètes
- **Vue d'ensemble** : Métriques principales et statistiques globales
- **Messages** : Conversations, contacts les plus actifs, chronologie détaillée
- **Connexions** : Followers (6,623), following (490), évolution du réseau
- **Posts & Médias** : 348+ posts, stories, reels analysés avec métriques temporelles
- **Activité** : Likes, commentaires, recherches, intérêts publicitaires
- **👻 Followers Inactifs** : Identification de ~75% de followers sans interaction
- **🔄 Suivis Non Réciproques** : Détection de 66 suivis sans retour

### 🕐 Filtres Temporels Avancés
- Filtrage par heure/jour/semaine/mois/année
- Plages personnalisées avec calendrier
- Application sur tous les onglets d'analyse

### ⚡ Performances optimisées
- **Parsing séquentiel stable** : Compatible Streamlit, gestion d'erreurs robuste
- **Système de cache intelligent** : TTL 1h pour performances optimales
- **Surveillance automatique** : Watchdog pour la détection des changements
- **Gestion mémoire** : Optimisé pour les gros datasets

### 🔒 Conformité Légale (v2.0)
- **RGPD** : Consentement, transparence, droit à l'oubli
- **IA Act** : Classification risque minimal, transparence algorithmique
- **IA Éthique** : Équité, explicabilité, responsabilité
- 🔐 **100% local** - Aucune transmission externe
- **Interface responsive** : S'adapte à tous les écrans

### 🛡️ Sécurité et confidentialité
- **100% local** : Vos données ne quittent jamais votre machine
- **Aucune connexion** : Fonctionne entièrement hors ligne
- **Code ouvert** : Transparence totale sur le traitement des données
- **Chiffrement** : Support des données chiffrées Instagram

## Structure des données

L'application analyse automatiquement tous les dossiers de données Instagram dans le répertoire `instagram_data/`.