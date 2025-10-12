import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime, timedelta
import os
from pathlib import Path

# Import des modules
from src.data_parser import InstagramDataParser
from src.utils import DateFilterManager, ProgressManager
from src.cache_manager import CacheManager, AsyncDataLoader, create_cache_management_ui
from src.compliance import RGPDCompliance, AIEthicsCompliance, show_compliance_footer
from src.social_analyzer import (
    display_inactive_followers_analysis, 
    display_non_reciprocal_following_analysis,
    create_relationship_insights
)


# Configuration de la page
st.set_page_config(
    page_title="Instagram Analytics Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS personnalisé
st.markdown("""
    <style>
    .main-header {
        font-size: 3rem;
        color: #E1306C;
        text-align: center;
        margin-bottom: 2rem;
        font-weight: bold;
    }
    .metric-card {
        background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
    }
    .section-header {
        color: #262730;
        border-bottom: 2px solid #E1306C;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
    }
    </style>
""", unsafe_allow_html=True)


@st.cache_data
@st.cache_resource
def initialize_managers():
    """Initialise les gestionnaires globaux"""
    cache_manager = CacheManager()
    date_filter_manager = DateFilterManager()
    data_loader = AsyncDataLoader(cache_manager)
    rgpd_compliance = RGPDCompliance()
    ai_ethics = AIEthicsCompliance()
    
    return cache_manager, date_filter_manager, data_loader, rgpd_compliance, ai_ethics


def load_instagram_data_with_cache(cache_manager, data_loader):
    """Charge les données Instagram avec gestion du cache et des erreurs"""
    try:
        # Vérifier la présence du dossier de données
        data_folder = Path("instagram_data")
        
        if not data_folder.exists():
            return None, "Le dossier 'instagram_data' n'existe pas."
        
        instagram_folders = list(data_folder.glob("instagram-*"))
        if not instagram_folders:
            return None, "Aucun dossier Instagram trouvé dans 'instagram_data'."
        
        # Utiliser le cache et la barre de progression
        force_refresh = st.session_state.get('force_refresh', False)
        if force_refresh:
            st.session_state.force_refresh = False
        
        data = data_loader.load_data_with_progress(
            str(data_folder), 
            use_threading=True,
            force_refresh=force_refresh
        )
        
        if data is None:
            return None, "Erreur lors du chargement des données."
        
        return data, None
        
    except Exception as e:
        return None, f"Erreur lors du chargement des données : {str(e)}"


def load_instagram_data():
    """Fonction de compatibilité pour l'ancien code"""
    cache_manager, _, data_loader, _, _ = initialize_managers()
    return load_instagram_data_with_cache(cache_manager, data_loader)


def apply_date_filters(data, date_filter_manager, start_date, end_date, dataframe_names):
    """Applique les filtres de date aux DataFrames spécifiés"""
    if start_date is None and end_date is None:
        return data
    
    filtered_data = data.copy()
    filtered_dataframes = {}
    
    for df_name in dataframe_names:
        if df_name in data['dataframes']:
            original_df = data['dataframes'][df_name]
            filtered_df = date_filter_manager.filter_dataframe_by_date(
                original_df, start_date, end_date
            )
            filtered_dataframes[df_name] = filtered_df
        else:
            filtered_dataframes[df_name] = pd.DataFrame()
    
    # Conserver les autres DataFrames non filtrés
    for df_name, df in data['dataframes'].items():
        if df_name not in dataframe_names:
            filtered_dataframes[df_name] = df
    
    filtered_data['dataframes'] = filtered_dataframes
    return filtered_data


def display_overview(data):
    """Affiche la vue d'ensemble des données"""
    st.markdown('<h2 class="section-header">📊 Vue d\'ensemble</h2>', unsafe_allow_html=True)
    
    # Métriques principales
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        messages_count = len(data['dataframes']['messages'])
        st.markdown(f"""
            <div class="metric-card">
                <h3>💬 Messages</h3>
                <h2>{messages_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        posts_count = len(data['dataframes']['posts'])
        st.markdown(f"""
            <div class="metric-card">
                <h3>📸 Posts</h3>
                <h2>{posts_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col3:
        followers_count = len(data['dataframes']['followers'])
        st.markdown(f"""
            <div class="metric-card">
                <h3>👥 Followers</h3>
                <h2>{followers_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col4:
        following_count = len(data['dataframes']['following'])
        st.markdown(f"""
            <div class="metric-card">
                <h3>➕ Following</h3>
                <h2>{following_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Informations sur les données
    st.markdown("### 📂 Informations sur les données")
    col1, col2 = st.columns(2)
    
    with col1:
        folders_found = data.get('folders_found', 'N/A')
        st.metric("Dossiers de données trouvés", folders_found)
        
        # Tableau récapitulatif
        summary_data = []
        for name, df in data['dataframes'].items():
            if len(df) > 0:
                summary_data.append({
                    'Type de données': name.title(),
                    'Nombre d\'éléments': len(df),
                    'Période': get_date_range(df) if has_date_column(df) else "Non disponible"
                })
        
        if summary_data:
            summary_df = pd.DataFrame(summary_data)
            st.dataframe(summary_df, use_container_width=True)
    
    with col2:
        # Graphique de répartition des données
        if summary_data:
            chart_data = pd.DataFrame(summary_data)
            fig = px.pie(
                chart_data, 
                values='Nombre d\'éléments', 
                names='Type de données',
                title="Répartition des données par type",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            fig.update_traces(textposition='inside', textinfo='percent+label')
            st.plotly_chart(fig, use_container_width=True)


def display_messages_analysis(messages_df):
    """Affiche l'analyse des messages"""
    if messages_df.empty:
        st.warning("Aucune donnée de message disponible.")
        return
    
    st.markdown('<h2 class="section-header">💬 Analyse des Messages</h2>', unsafe_allow_html=True)
    
    # Préparer les données
    messages_df = messages_df.copy()
    
    # Convertir les dates si possible
    if 'date' in messages_df.columns:
        messages_df['date'] = pd.to_datetime(messages_df['date'], errors='coerce')
        messages_df = messages_df.dropna(subset=['date'])
    
    if messages_df.empty:
        st.warning("Aucune donnée de message avec date valide.")
        return
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Messages par conversation
        if 'conversation' in messages_df.columns:
            conv_stats = messages_df['conversation'].value_counts().head(10)
            fig = px.bar(
                x=conv_stats.values,
                y=conv_stats.index,
                orientation='h',
                title="Top 10 des conversations les plus actives",
                labels={'x': 'Nombre de messages', 'y': 'Conversation'}
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Messages par mois
        if 'date' in messages_df.columns:
            messages_df['year_month'] = messages_df['date'].dt.to_period('M')
            monthly_stats = messages_df['year_month'].value_counts().sort_index()
            
            fig = px.line(
                x=monthly_stats.index.astype(str),
                y=monthly_stats.values,
                title="Évolution des messages par mois",
                labels={'x': 'Mois', 'y': 'Nombre de messages'}
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
    
    # Analyse temporelle détaillée
    st.markdown("### 📅 Analyse temporelle")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        # Messages par jour de la semaine
        if 'date' in messages_df.columns:
            messages_df['day_of_week'] = messages_df['date'].dt.day_name()
            daily_stats = messages_df['day_of_week'].value_counts()
            
            # Ordonner les jours
            days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            daily_stats = daily_stats.reindex(days_order, fill_value=0)
            
            fig = px.bar(
                x=daily_stats.index,
                y=daily_stats.values,
                title="Messages par jour de la semaine",
                labels={'x': 'Jour', 'y': 'Nombre de messages'}
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Messages par heure
        if 'date' in messages_df.columns:
            messages_df['hour'] = messages_df['date'].dt.hour
            hourly_stats = messages_df['hour'].value_counts().sort_index()
            
            fig = px.bar(
                x=hourly_stats.index,
                y=hourly_stats.values,
                title="Messages par heure de la journée",
                labels={'x': 'Heure', 'y': 'Nombre de messages'}
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col3:
        # Top expéditeurs
        if 'sender' in messages_df.columns:
            sender_stats = messages_df['sender'].value_counts().head(10)
            
            fig = px.pie(
                values=sender_stats.values,
                names=sender_stats.index,
                title="Top expéditeurs"
            )
            st.plotly_chart(fig, use_container_width=True)


def display_connections_analysis(followers_df, following_df):
    """Affiche l'analyse des connexions"""
    st.markdown('<h2 class="section-header">👥 Analyse des Connexions</h2>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Followers", len(followers_df))
        if not followers_df.empty and 'username' in followers_df.columns:
            st.write("**Derniers followers:**")
            st.dataframe(followers_df['username'].head(10), use_container_width=True)
    
    with col2:
        st.metric("Following", len(following_df))
        if not following_df.empty and 'username' in following_df.columns:
            st.write("**Derniers suivis:**")
            st.dataframe(following_df['username'].head(10), use_container_width=True)
    
    # Ratio suivis/followers
    if len(followers_df) > 0 and len(following_df) > 0:
        ratio = len(following_df) / len(followers_df)
        st.metric("Ratio Following/Followers", f"{ratio:.2f}")
        
        # Graphique de comparaison
        fig = go.Figure(data=[
            go.Bar(name='Followers', x=['Connexions'], y=[len(followers_df)]),
            go.Bar(name='Following', x=['Connexions'], y=[len(following_df)])
        ])
        fig.update_layout(
            title='Comparaison Followers vs Following',
            barmode='group'
        )
        st.plotly_chart(fig, use_container_width=True)


def has_date_column(df):
    """Vérifie si le DataFrame a une colonne de date"""
    return 'date' in df.columns or 'timestamp' in df.columns


def get_date_range(df):
    """Obtient la plage de dates d'un DataFrame"""
    try:
        date_col = 'date' if 'date' in df.columns else 'timestamp'
        dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
        if len(dates) > 0:
            return f"{dates.min().strftime('%Y-%m-%d')} à {dates.max().strftime('%Y-%m-%d')}"
        return "Non disponible"
    except:
        return "Non disponible"


def display_posts_media_analysis(data):
    """Affiche l'analyse des posts et médias"""
    st.markdown('<h2 class="section-header">📸 Posts & Médias</h2>', unsafe_allow_html=True)
    
    posts_df = data['dataframes']['posts']
    stories_df = data['dataframes']['stories']
    
    # Métriques principales
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
            <div class="metric-card">
                <h3>📝 Posts</h3>
                <h2>{len(posts_df):,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
            <div class="metric-card">
                <h3>📚 Stories</h3>
                <h2>{len(stories_df):,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col3:
        if not posts_df.empty and 'type' in posts_df.columns:
            reels_count = len(posts_df[posts_df['type'] == 'reel'])
            st.markdown(f"""
                <div class="metric-card">
                    <h3>🎬 Reels</h3>
                    <h2>{reels_count:,}</h2>
                </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
                <div class="metric-card">
                    <h3>🎬 Reels</h3>
                    <h2>0</h2>
                </div>
            """, unsafe_allow_html=True)
    
    with col4:
        total_media = len(posts_df) + len(stories_df)
        st.markdown(f"""
            <div class="metric-card">
                <h3>📊 Total</h3>
                <h2>{total_media:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    if not posts_df.empty:
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📈 Types de contenu")
            if 'type' in posts_df.columns:
                type_counts = posts_df['type'].value_counts()
                fig = px.pie(
                    values=type_counts.values,
                    names=type_counts.index,
                    title="Répartition par type de contenu"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Données de type non disponibles")
        
        with col2:
            st.subheader("📅 Activité dans le temps")
            if 'timestamp' in posts_df.columns:
                # Convertir les timestamps en dates
                posts_df_copy = posts_df.copy()
                posts_df_copy['date'] = pd.to_datetime(posts_df_copy['timestamp'], unit='s', errors='coerce')
                posts_df_copy = posts_df_copy.dropna(subset=['date'])
                
                if not posts_df_copy.empty:
                    posts_df_copy['month'] = posts_df_copy['date'].dt.strftime('%Y-%m')
                    monthly_counts = posts_df_copy['month'].value_counts().sort_index()
                    
                    fig = px.line(
                        x=monthly_counts.index,
                        y=monthly_counts.values,
                        title="Posts par mois"
                    )
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.info("Données de date non disponibles")
            else:
                st.info("Données de date non disponibles")
    
    # Aperçu des données
    if not posts_df.empty:
        st.subheader("🔍 Aperçu des données")
        st.dataframe(posts_df.head(10))
    else:
        st.info("Aucune donnée de posts disponible.")


def display_activity_analysis(data):
    """Affiche l'analyse de l'activité"""
    st.markdown('<h2 class="section-header">🎯 Activité</h2>', unsafe_allow_html=True)
    
    likes_df = data['dataframes']['likes']
    comments_df = data['dataframes']['comments']
    search_df = data['dataframes'].get('search_history', pd.DataFrame())
    ads_df = data['dataframes'].get('ads_data', pd.DataFrame())
    
    # Métriques principales
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
            <div class="metric-card">
                <h3>❤️ Likes</h3>
                <h2>{len(likes_df):,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
            <div class="metric-card">
                <h3>💬 Commentaires</h3>
                <h2>{len(comments_df):,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
            <div class="metric-card">
                <h3>🔍 Recherches</h3>
                <h2>{len(search_df):,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
            <div class="metric-card">
                <h3>📊 Publicités</h3>
                <h2>{len(ads_df):,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Graphiques d'activité
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📈 Évolution des likes")
        if not likes_df.empty and 'timestamp' in likes_df.columns:
            likes_df_copy = likes_df.copy()
            likes_df_copy['date'] = pd.to_datetime(likes_df_copy['timestamp'], unit='s', errors='coerce')
            likes_df_copy = likes_df_copy.dropna(subset=['date'])
            
            if not likes_df_copy.empty:
                likes_df_copy['month'] = likes_df_copy['date'].dt.strftime('%Y-%m')
                monthly_likes = likes_df_copy['month'].value_counts().sort_index()
                
                fig = px.bar(
                    x=monthly_likes.index,
                    y=monthly_likes.values,
                    title="Likes par mois"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Données de date non disponibles pour les likes")
        else:
            st.info("Aucune donnée de likes disponible")
    
    with col2:
        st.subheader("🔍 Recherches populaires")
        if not search_df.empty and 'search_text' in search_df.columns:
            search_counts = search_df['search_text'].value_counts().head(10)
            
            if not search_counts.empty:
                fig = px.bar(
                    x=search_counts.values,
                    y=search_counts.index,
                    orientation='h',
                    title="Top 10 des recherches"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Aucune recherche trouvée")
        else:
            st.info("Données de recherche non disponibles")
    
    # Intérêts publicitaires
    if not ads_df.empty:
        st.subheader("🎯 Intérêts publicitaires")
        if 'topic' in ads_df.columns:
            topic_counts = ads_df['topic'].value_counts().head(15)
            
            if not topic_counts.empty:
                fig = px.bar(
                    x=topic_counts.values,
                    y=topic_counts.index,
                    orientation='h',
                    title="Top 15 des intérêts publicitaires"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Aucun intérêt publicitaire trouvé")
        else:
            st.info("Données d'intérêts publicitaires non disponibles")
    
    # Aperçu des données
    st.subheader("🔍 Données d'activité récentes")
    
    tab1, tab2, tab3 = st.tabs(["❤️ Likes", "🔍 Recherches", "🎯 Publicités"])
    
    with tab1:
        if not likes_df.empty:
            st.dataframe(likes_df.head(10))
        else:
            st.info("Aucune donnée de likes disponible")
    
    with tab2:
        if not search_df.empty:
            st.dataframe(search_df.head(10))
        else:
            st.info("Aucune donnée de recherche disponible")
    
    with tab3:
        if not ads_df.empty:
            st.dataframe(ads_df.head(10))
        else:
            st.info("Aucune donnée publicitaire disponible")


def main():
    """Fonction principale de l'application"""
    
    # Initialiser les gestionnaires
    cache_manager, date_filter_manager, data_loader, rgpd_compliance, ai_ethics = initialize_managers()
    
    # Vérifier la conformité RGPD
    if not rgpd_compliance.show_privacy_banner():
        return  # Arrêter si le consentement n'est pas donné
    
    # En-tête
    st.markdown('<h1 class="main-header">📊 Instagram Analytics Dashboard</h1>', unsafe_allow_html=True)
    st.markdown("---")
    
    # Afficher les informations de conformité
    ai_ethics.show_ai_ethics_info()
    
    # Interface de gestion du cache dans la sidebar
    create_cache_management_ui(cache_manager)
    
    # Paramètres de confidentialité dans la sidebar
    rgpd_compliance.show_privacy_settings()
    
    # Chargement des données avec cache
    with st.spinner("Chargement des données Instagram..."):
        data, error = load_instagram_data_with_cache(cache_manager, data_loader)
    
    if error:
        st.error(error)
        st.markdown("""
        ### 📝 Instructions :
        1. Exportez vos données Instagram depuis votre compte
        2. Décompressez le fichier ZIP obtenu
        3. Placez le(s) dossier(s) `instagram-*` dans un dossier `instagram_data` à la racine de ce projet
        4. Relancez l'application
        """)
        return
    
    if not data:
        st.error("Impossible de charger les données.")
        return
    
    # Navigation
    st.sidebar.title("🧭 Navigation")
    section = st.sidebar.selectbox(
        "Choisir une section",
        [
            "Vue d'ensemble", 
            "Messages", 
            "Connexions", 
            "Posts & Médias", 
            "Activité",
            "👻 Followers Inactifs",
            "🔄 Suivis Non Réciproques"
        ]
    )
    
    # Filtres temporels (pour les sections applicables)
    filter_type, start_date, end_date = None, None, None
    if section in ["Messages", "Posts & Médias", "Activité"]:
        filter_type, start_date, end_date = date_filter_manager.create_date_filter_ui(section.lower())
    
    # Affichage des sections
    if section == "Vue d'ensemble":
        display_overview(data)
    
    elif section == "Messages":
        filtered_data = apply_date_filters(data, date_filter_manager, start_date, end_date, ['messages'])
        display_messages_analysis(filtered_data['dataframes']['messages'])
        date_filter_manager.display_filter_summary(
            data['dataframes']['messages'], 
            filtered_data['dataframes']['messages']
        )
    
    elif section == "Connexions":
        display_connections_analysis(
            data['dataframes']['followers'], 
            data['dataframes']['following']
        )
        
    elif section == "Posts & Médias":
        filtered_data = apply_date_filters(data, date_filter_manager, start_date, end_date, ['posts', 'stories'])
        display_posts_media_analysis(filtered_data)
        date_filter_manager.display_filter_summary(
            data['dataframes']['posts'], 
            filtered_data['dataframes']['posts']
        )
        
    elif section == "Activité":
        filtered_data = apply_date_filters(data, date_filter_manager, start_date, end_date, ['likes', 'comments', 'search_history'])
        display_activity_analysis(filtered_data)
        date_filter_manager.display_filter_summary(
            data['dataframes']['likes'], 
            filtered_data['dataframes']['likes']
        )
        
    elif section == "👻 Followers Inactifs":
        display_inactive_followers_analysis(data)
        
    elif section == "🔄 Suivis Non Réciproques":
        display_non_reciprocal_following_analysis(data)    # Footer de conformité
    show_compliance_footer()


if __name__ == "__main__":
    main()