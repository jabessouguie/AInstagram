# Instagram Analytics Dashboard

## Vue d'ensemble

Ce dashboard vous permet d'analyser vos données Instagram exportées de manière sécurisée et privée, directement sur votre ordinateur. Aucune donnée n'est envoyée vers des serveurs externes.

## Comment obtenir vos données Instagram

1. **Se connecter à Instagram** : Allez sur instagram.com et connectez-vous
2. **Accéder aux paramètres** : Cliquez sur votre photo de profil → Paramètres
3. **Demander vos données** : 
   - Allez dans "Confidentialité et sécurité"
   - Cliquez sur "Demander le téléchargement"
   - Sélectionnez "Toutes les données disponibles"
   - Choisissez le format "HTML" (recommandé)
   - Cliquez sur "Demander le téléchargement"
4. **Télécharger** : Instagram vous enverra un email avec un lien de téléchargement (peut prendre jusqu'à 48h)

## Installation et lancement

### Option 1 : Script automatique (recommandé)

**Sur Windows :**
- Double-cliquez sur `run.bat`

**Sur macOS/Linux :**
- Ouvrez un terminal dans le dossier du projet
- Exécutez : `./run.sh`

**Ou avec Python directement :**
```bash
python run.py
```

### Option 2 : Installation manuelle

1. **Installer les dépendances :**
```bash
pip install -r requirements.txt
```

2. **Lancer le dashboard :**
```bash
streamlit run dashboard.py
```

## Structure des données

Placez vos données Instagram dans le dossier `instagram_data/` selon cette structure :

```
instagram_data/
├── instagram-username-2025-01-01-xxxxxx/
│   ├── your_instagram_activity/
│   │   ├── messages/
│   │   ├── likes/
│   │   └── comments/
│   ├── connections/
│   │   └── followers_and_following/
│   ├── media/
│   │   ├── posts/
│   │   └── stories/
│   └── personal_information/
└── (autres dossiers d'export Instagram...)
```

## 🎯 Fonctionnalités

### 📊 Vue d'ensemble
- Métriques principales de votre profil (messages, posts, followers, following)
- Répartition des types de données avec graphiques interactifs
- Informations détaillées sur la période d'activité
- Résumé des dossiers de données traités

### 💬 Analyse des messages
- Nombre total de conversations et messages
- Distribution des messages par contact avec graphiques
- Chronologie des échanges dans le temps
- Top des contacts les plus actifs
- Analyses temporelles avancées

### 👥 Analyse des connexions
- Listes complètes de followers et following
- Évolution du réseau au fil du temps
- Analyses comparatives et métriques d'engagement
- Visualisations interactives

### 📸 Posts & Médias (NOUVEAU)
- Analyse complète de tous vos posts, stories et reels
- Répartition par type de contenu (posts, stories, reels, autres)
- Évolution de votre activité de publication dans le temps
- Métriques de fréquence de publication
- Aperçu détaillé des métadonnées

### 🎯 Activité (NOUVEAU)
- Analyse de vos likes et interactions
- Historique des recherches Instagram
- Intérêts publicitaires détectés par Instagram
- Évolution de votre engagement dans le temps
- Top des recherches les plus fréquentes
- Profil publicitaire détaillé

### 📸 Posts & Médias
- **Statistiques des posts** : Nombre de publications par période
- **Analyse des stories** : Fréquence et patterns de publication
- **Types de contenu** : Répartition photos/vidéos

### ⚡ Optimisations techniques
- **Threading avancé** : Parsing multi-threadé pour des performances jusqu'à 70% plus rapides
- **Surveillance automatique** : Watchdog intégré pour la détection automatique des changements
- **Chargement optimisé** : Parse intelligent avec gestion d'erreurs robuste
- **Interface responsive** : S'adapte à tous les écrans
- **Visualisations interactives** : Graphiques Plotly zoomables et filtrables
- **Gestion mémoire** : Optimisation pour les gros datasets

## Sécurité et confidentialité

✅ **Toutes vos données restent sur votre ordinateur**
✅ **Aucune connexion internet requise pour l'analyse**
✅ **Code source ouvert et transparent**
✅ **Pas de collecte de données**

## Résolution de problèmes

### "Le dossier instagram_data n'existe pas"
- Créez un dossier nommé `instagram_data` dans le répertoire du projet
- Placez-y vos dossiers d'export Instagram

### "Aucun dossier de données Instagram trouvé"
- Vérifiez que vos dossiers commencent par "instagram-"
- Assurez-vous d'avoir décompressé les fichiers ZIP téléchargés

### "Erreur lors du chargement des données"
- Vérifiez que vos données sont dans le bon format (HTML recommandé)
- Certains exports peuvent être partiels, c'est normal
- Contactez le support si le problème persiste

### Problèmes d'installation Python
- Assurez-vous d'avoir Python 3.8 ou plus récent
- Sur Windows, cochez "Add Python to PATH" lors de l'installation
- Sur macOS, utilisez Homebrew : `brew install python`

## Support technique

Si vous rencontrez des problèmes :

1. **Vérifiez les prérequis** : Python 3.8+, données dans le bon dossier
2. **Consultez les logs** : Les messages d'erreur dans le terminal
3. **Redémarrez** : Fermez et relancez le dashboard
4. **Données partielles** : Certaines sections peuvent être vides si Instagram n'a pas exporté ces données

## Commandes utiles

```bash
# Vérifier la version de Python
python --version

# Installer une dépendance spécifique
pip install streamlit

# Relancer avec debug
streamlit run dashboard.py --logger.level=debug

# Nettoyer le cache
streamlit cache clear
```

## Mise à jour

Pour mettre à jour le dashboard :
1. Téléchargez la nouvelle version
2. Copiez votre dossier `instagram_data` dans la nouvelle version
3. Relancez avec `python run.py`

---

**Note importante** : Ce dashboard est un outil d'analyse personnel. Il respecte les conditions d'utilisation d'Instagram en travaillant uniquement avec vos propres données exportées.