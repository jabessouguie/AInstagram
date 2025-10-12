"""
Analyseur des relations sociales Instagram
"""
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from typing import Dict, List, Set, Tuple, Optional
import re


class SocialRelationshipAnalyzer:
    """Analyseur des relations sociales Instagram"""
    
    def __init__(self, data: Dict):
        self.data = data
        self.dataframes = data.get('dataframes', {})
    
    def analyze_inactive_followers(self) -> pd.DataFrame:
        """
        Analyse les followers qui n'ont jamais interagi avec vos posts
        
        Returns:
            DataFrame avec les followers inactifs
        """
        followers_df = self.dataframes.get('followers', pd.DataFrame())
        likes_df = self.dataframes.get('likes', pd.DataFrame())
        comments_df = self.dataframes.get('comments', pd.DataFrame())
        
        if followers_df.empty:
            return pd.DataFrame(columns=['username', 'follow_date', 'profile_url', 'interaction_score'])
        
        # Obtenir la liste des followers avec le nouveau format
        followers_set = set()
        followers_data = {}
        
        if 'username' in followers_df.columns:
            for idx, row in followers_df.iterrows():
                username = row['username']
                if pd.notna(username):
                    followers_set.add(username)
                    
                    # Récupérer la date de follow si disponible
                    follow_date = None
                    if 'date_found' in row and pd.notna(row['date_found']):
                        try:
                            date_str = row['date_found']
                            if isinstance(date_str, str) and ('2025' in date_str or '2024' in date_str):
                                follow_date = pd.to_datetime(date_str, errors='coerce')
                        except:
                            pass
                    
                    followers_data[username] = {
                        'follow_date': follow_date,
                        'profile_url': f"https://instagram.com/{username}"
                    }
        
        # Format alternatif (fallback)
        elif 'string_list_data' in followers_df.columns:
            for entry in followers_df['string_list_data']:
                if isinstance(entry, list):
                    for item in entry:
                        if isinstance(item, dict) and 'value' in item:
                            username = item['value']
                            followers_set.add(username)
                            followers_data[username] = {
                                'follow_date': None,
                                'profile_url': f"https://instagram.com/{username}"
                            }
        
        # Obtenir les utilisateurs qui ont interagi (pour l'instant, considérer tous comme inactifs)
        # TODO: Améliorer quand on aura les données de likes/comments
        interacted_users = set()
        
        # Les utilisateurs qui ont liké vos posts
        if not likes_df.empty:
            if 'username' in likes_df.columns:
                interacted_users.update(likes_df['username'].dropna())
            elif 'string_list_data' in likes_df.columns:
                for entry in likes_df['string_list_data']:
                    if isinstance(entry, list):
                        for item in entry:
                            if isinstance(item, dict) and 'value' in item:
                                interacted_users.add(item['value'])
        
        # Les utilisateurs qui ont commenté vos posts  
        if not comments_df.empty:
            if 'username' in comments_df.columns:
                interacted_users.update(comments_df['username'].dropna())
            elif 'string_list_data' in comments_df.columns:
                for entry in comments_df['string_list_data']:
                    if isinstance(entry, list):
                        for item in entry:
                            if isinstance(item, dict) and 'value' in item:
                                interacted_users.add(item['value'])
        
        print(f"🔍 Analyse followers inactifs:")
        print(f"   👥 Total followers: {len(followers_set)}")
        print(f"   💬 Utilisateurs ayant interagi: {len(interacted_users)}")
        
        # Identifier les followers inactifs
        inactive_followers = followers_set - interacted_users
        print(f"   👻 Followers inactifs: {len(inactive_followers)}")
        
        # Créer le DataFrame des résultats
        results = []
        for username in inactive_followers:            
            user_data = followers_data.get(username, {})
            follow_date = user_data.get('follow_date')
            profile_url = user_data.get('profile_url', f"https://instagram.com/{username}")
            
            results.append({
                'username': username,
                'follow_date': follow_date,
                'profile_url': profile_url,
                'interaction_score': 0,  # Aucune interaction détectée
                'status': 'Follower inactif',
                'days_following': (datetime.now() - follow_date).days if follow_date else None
            })
        
        df_results = pd.DataFrame(results)
        
        # Trier par date de suivi (plus anciens en premier)
        if not df_results.empty and 'days_following' in df_results.columns:
            df_results = df_results.sort_values('days_following', ascending=False, na_position='last')
        
        return df_results
    
    def analyze_non_reciprocal_following(self, months_threshold: int = 1) -> pd.DataFrame:
        """
        Analyse les comptes suivis qui ne vous suivent pas en retour
        
        Args:
            months_threshold: Seuil en mois pour considérer un suivi comme "ancien"
        
        Returns:
            DataFrame avec les suivis non réciproques
        """
        following_df = self.dataframes.get('following', pd.DataFrame())
        followers_df = self.dataframes.get('followers', pd.DataFrame())
        
        if following_df.empty:
            return pd.DataFrame(columns=['username', 'follow_date', 'profile_url', 'days_following', 'category'])
        
        # Obtenir la liste des comptes suivis avec le nouveau format
        following_set = set()
        following_dates = {}
        
        # Nouveau format avec colonnes directes
        if 'username' in following_df.columns:
            for idx, row in following_df.iterrows():
                username = row['username']
                if pd.notna(username):
                    following_set.add(username)
                    
                    # Récupérer la date si disponible  
                    if 'date_found' in row and pd.notna(row['date_found']):
                        try:
                            date_str = row['date_found']
                            if isinstance(date_str, str) and ('2025' in date_str or '2024' in date_str):
                                # Parser la date format "Oct 11, 2025 1:56 am"
                                follow_date = pd.to_datetime(date_str, errors='coerce')
                                if pd.notna(follow_date):
                                    following_dates[username] = follow_date
                        except Exception as e:
                            print(f"Erreur parsing date pour {username}: {e}")
        
        # Ancien format (fallback)
        elif 'string_list_data' in following_df.columns:
            for idx, entry in following_df.iterrows():
                if isinstance(entry['string_list_data'], list):
                    for item in entry['string_list_data']:
                        if isinstance(item, dict) and 'value' in item:
                            username = item['value']
                            following_set.add(username)
                            
                            # Récupérer la date si disponible
                            if 'timestamp' in entry and pd.notna(entry['timestamp']):
                                try:
                                    follow_date = pd.to_datetime(entry['timestamp'], unit='s')
                                    following_dates[username] = follow_date
                                except:
                                    pass
        
        # Obtenir la liste des followers avec le nouveau format
        followers_set = set()
        if not followers_df.empty:
            if 'username' in followers_df.columns:
                followers_set = set(followers_df['username'].dropna())
            elif 'string_list_data' in followers_df.columns:
                for entry in followers_df['string_list_data']:
                    if isinstance(entry, list):
                        for item in entry:
                            if isinstance(item, dict) and 'value' in item:
                                followers_set.add(item['value'])
        
        print(f"🔍 Analyse suivis non réciproques:")
        print(f"   📤 Following: {len(following_set)}")
        print(f"   📥 Followers: {len(followers_set)}")
        
        # Identifier les suivis non réciproques
        non_reciprocal = following_set - followers_set
        print(f"   🔄 Non réciproques: {len(non_reciprocal)}")
        
        # Filtrer par ancienneté
        cutoff_date = datetime.now() - timedelta(days=30 * months_threshold)
        results = []
        
        for username in non_reciprocal:
            follow_date = following_dates.get(username)
            profile_url = f"https://instagram.com/{username}"
            
            days_following = None
            category = "Récent"
            
            if follow_date:
                days_following = (datetime.now() - follow_date.replace(tzinfo=None)).days
                
                if follow_date.replace(tzinfo=None) <= cutoff_date:
                    category = f"Ancien (>{months_threshold} mois)"
                else:
                    category = f"Récent (<{months_threshold} mois)"
            
            # Inclure seulement les suivis anciens selon le seuil
            if follow_date is None or follow_date.replace(tzinfo=None) <= cutoff_date:
                results.append({
                    'username': username,
                    'follow_date': follow_date,
                    'profile_url': profile_url,
                    'days_following': days_following,
                    'category': category
                })
        
        df_results = pd.DataFrame(results)
        
        # Trier par ancienneté
        if not df_results.empty and 'days_following' in df_results.columns:
            df_results = df_results.sort_values('days_following', ascending=False, na_position='last')
        
        return df_results
    
    def get_engagement_stats(self) -> Dict:
        """Calcule les statistiques d'engagement général"""
        followers_count = len(self.dataframes.get('followers', []))
        following_count = len(self.dataframes.get('following', []))
        likes_count = len(self.dataframes.get('likes', []))
        comments_count = len(self.dataframes.get('comments', []))
        posts_count = len(self.dataframes.get('posts', []))
        
        return {
            'followers': followers_count,
            'following': following_count,
            'likes_given': likes_count,
            'comments_made': comments_count,
            'posts_created': posts_count,
            'follow_ratio': followers_count / max(following_count, 1),
            'engagement_per_post': (likes_count + comments_count) / max(posts_count, 1)
        }


def display_inactive_followers_analysis(data):
    """Affiche l'analyse des followers inactifs"""
    st.markdown('<h2 class="section-header">👻 Followers Inactifs</h2>', unsafe_allow_html=True)
    
    analyzer = SocialRelationshipAnalyzer(data)
    inactive_df = analyzer.analyze_inactive_followers()
    
    if inactive_df.empty:
        st.info("🎉 Excellent ! Tous vos followers ont interagi avec vos posts.")
        return
    
    # Métriques
    col1, col2, col3, col4 = st.columns(4)
    
    total_followers = len(data['dataframes'].get('followers', []))
    inactive_count = len(inactive_df)
    active_count = total_followers - inactive_count
    inactive_percentage = (inactive_count / max(total_followers, 1)) * 100
    
    with col1:
        st.markdown(f"""
            <div class="metric-card">
                <h3>👥 Total Followers</h3>
                <h2>{total_followers:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
            <div class="metric-card">
                <h3>✅ Actifs</h3>
                <h2>{active_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
            <div class="metric-card">
                <h3>👻 Inactifs</h3>
                <h2>{inactive_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
            <div class="metric-card">
                <h3>📊 % Inactifs</h3>
                <h2>{inactive_percentage:.1f}%</h2>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Graphique de répartition
    col1, col2 = st.columns(2)
    
    with col1:
        fig = px.pie(
            values=[active_count, inactive_count],
            names=['Followers actifs', 'Followers inactifs'],
            title="Répartition des followers",
            color_discrete_sequence=['#1f77b4', '#ff7f0e']
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        if inactive_count > 0:
            # Graphique temporel si dates disponibles
            if 'follow_date' in inactive_df.columns and inactive_df['follow_date'].notna().any():
                inactive_df_dated = inactive_df.dropna(subset=['follow_date'])
                inactive_df_dated['month'] = inactive_df_dated['follow_date'].dt.strftime('%Y-%m')
                monthly_inactive = inactive_df_dated['month'].value_counts().sort_index()
                
                fig = px.bar(
                    x=monthly_inactive.index,
                    y=monthly_inactive.values,
                    title="Followers inactifs par mois de suivi"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Données de date de suivi non disponibles pour l'analyse temporelle")
    
    # Table des followers inactifs
    st.subheader("📋 Liste des followers inactifs")
    
    if len(inactive_df) > 0:
        # Limiter l'affichage pour les performances
        display_limit = st.slider("Nombre de résultats à afficher", 10, min(100, len(inactive_df)), 20)
        
        # Préparer les données pour l'affichage
        display_df = inactive_df.head(display_limit).copy()
        display_df['Profile Link'] = display_df.apply(
            lambda row: f'<a href="{row["profile_url"]}" target="_blank">@{row["username"]}</a>',
            axis=1
        )
        
        # Colonnes à afficher
        columns_to_show = ['username', 'Profile Link', 'follow_date', 'status']
        available_columns = [col for col in columns_to_show if col in display_df.columns]
        
        st.markdown(
            display_df[available_columns].to_html(escape=False, index=False),
            unsafe_allow_html=True
        )
        
        # Bouton d'export
        if st.button("📥 Exporter la liste complète (CSV)"):
            csv = inactive_df.to_csv(index=False)
            st.download_button(
                label="Télécharger CSV",
                data=csv,
                file_name=f"followers_inactifs_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
    
    # Conseils d'action
    st.markdown("### 💡 Conseils d'action")
    if inactive_percentage > 50:
        st.warning("⚠️ Plus de 50% de vos followers sont inactifs. Considérez une stratégie de réengagement.")
    elif inactive_percentage > 25:
        st.info("💡 Environ 25% de vos followers sont inactifs. C'est dans la normale pour la plupart des comptes.")
    else:
        st.success("🎉 Excellent taux d'engagement ! Moins de 25% de followers inactifs.")
    
    st.markdown("""
    **Actions possibles :**
    - 🎯 Créer du contenu plus engageant
    - 📅 Poster à des heures d'activité optimales
    - 💬 Encourager les interactions avec des questions
    - 🏷️ Utiliser des hashtags pertinents
    - 📱 Analyser les types de contenu qui fonctionnent le mieux
    """)


def display_non_reciprocal_following_analysis(data):
    """Affiche l'analyse des suivis non réciproques"""
    st.markdown('<h2 class="section-header">🔄 Suivis Non Réciproques</h2>', unsafe_allow_html=True)
    
    analyzer = SocialRelationshipAnalyzer(data)
    
    # Sélecteur de seuil temporel
    months_threshold = st.selectbox(
        "Considérer comme 'ancien' les suivis de plus de :",
        [1, 2, 3, 6, 12],
        index=0,
        format_func=lambda x: f"{x} mois"
    )
    
    non_reciprocal_df = analyzer.analyze_non_reciprocal_following(months_threshold)
    
    if non_reciprocal_df.empty:
        st.success(f"🎉 Aucun suivi non réciproque de plus de {months_threshold} mois trouvé !")
        return
    
    # Métriques
    col1, col2, col3, col4 = st.columns(4)
    
    total_following = len(data['dataframes'].get('following', []))
    non_reciprocal_count = len(non_reciprocal_df)
    avg_days = non_reciprocal_df['days_following'].mean() if 'days_following' in non_reciprocal_df.columns else 0
    
    with col1:
        st.markdown(f"""
            <div class="metric-card">
                <h3>👥 Total Suivis</h3>
                <h2>{total_following:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
            <div class="metric-card">
                <h3>🔄 Non Réciproques</h3>
                <h2>{non_reciprocal_count:,}</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col3:
        percentage = (non_reciprocal_count / max(total_following, 1)) * 100
        st.markdown(f"""
            <div class="metric-card">
                <h3>📊 Pourcentage</h3>
                <h2>{percentage:.1f}%</h2>
            </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
            <div class="metric-card">
                <h3>⏱️ Durée Moyenne</h3>
                <h2>{avg_days:.0f} jours</h2>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Graphiques d'analyse
    col1, col2 = st.columns(2)
    
    with col1:
        if 'category' in non_reciprocal_df.columns:
            category_counts = non_reciprocal_df['category'].value_counts()
            fig = px.pie(
                values=category_counts.values,
                names=category_counts.index,
                title="Répartition par ancienneté"
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        if 'days_following' in non_reciprocal_df.columns and non_reciprocal_df['days_following'].notna().any():
            fig = px.histogram(
                non_reciprocal_df,
                x='days_following',
                nbins=20,
                title="Distribution par durée de suivi (jours)"
            )
            st.plotly_chart(fig, use_container_width=True)
    
    # Table des suivis non réciproques
    st.subheader("📋 Liste des suivis non réciproques")
    
    if len(non_reciprocal_df) > 0:
        # Limiter l'affichage
        display_limit = st.slider("Nombre de résultats à afficher", 10, min(100, len(non_reciprocal_df)), 20)
        
        # Préparer les données pour l'affichage
        display_df = non_reciprocal_df.head(display_limit).copy()
        display_df['Profile Link'] = display_df.apply(
            lambda row: f'<a href="{row["profile_url"]}" target="_blank">@{row["username"]}</a>',
            axis=1
        )
        
        # Formater la date
        if 'follow_date' in display_df.columns:
            display_df['Date de suivi'] = display_df['follow_date'].dt.strftime('%d/%m/%Y')
        
        # Colonnes à afficher
        columns_to_show = ['username', 'Profile Link', 'Date de suivi', 'days_following', 'category']
        available_columns = [col for col in columns_to_show if col in display_df.columns]
        
        st.markdown(
            display_df[available_columns].to_html(escape=False, index=False),
            unsafe_allow_html=True
        )
        
        # Bouton d'export
        if st.button("📥 Exporter la liste complète (CSV)", key="export_non_reciprocal"):
            csv = non_reciprocal_df.to_csv(index=False)
            st.download_button(
                label="Télécharger CSV",
                data=csv,
                file_name=f"suivis_non_reciproques_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
    
    # Conseils de gestion
    st.markdown("### 💡 Conseils de gestion")
    
    if percentage > 70:
        st.warning("⚠️ Plus de 70% de vos suivis ne vous suivent pas en retour. Considérez un nettoyage.")
    elif percentage > 50:
        st.info("💡 Environ la moitié de vos suivis ne sont pas réciproques. C'est courant mais peut être optimisé.")
    else:
        st.success("✅ Bon ratio de réciprocité dans vos suivis !")
    
    st.markdown("""
    **Actions possibles :**
    - 🧹 Désabonner les comptes les plus anciens sans réciprocité
    - 📊 Analyser pourquoi certains comptes ne vous suivent pas en retour
    - 🎯 Être plus sélectif dans vos nouveaux abonnements
    - 💬 Interagir davantage avec les comptes que vous suivez
    - 🤝 Privilégier l'engagement mutuel
    """)


def create_relationship_insights(data) -> Dict:
    """Crée des insights sur les relations sociales"""
    analyzer = SocialRelationshipAnalyzer(data)
    engagement_stats = analyzer.get_engagement_stats()
    
    insights = {
        'follow_ratio': engagement_stats['follow_ratio'],
        'engagement_health': 'good' if engagement_stats['follow_ratio'] > 0.5 else 'needs_attention',
        'total_interactions': engagement_stats['likes_given'] + engagement_stats['comments_made'],
        'recommendations': []
    }
    
    # Générer des recommandations
    if engagement_stats['follow_ratio'] < 0.3:
        insights['recommendations'].append("Considérez de désabonner certains comptes pour améliorer votre ratio")
    
    if engagement_stats['engagement_per_post'] < 2:
        insights['recommendations'].append("Augmentez votre engagement en likant et commentant plus")
    
    return insights