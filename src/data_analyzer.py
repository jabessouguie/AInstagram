"""
Utilitaires pour l'analyse des données Instagram
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import re
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import seaborn as sns


class DataAnalyzer:
    """Classe utilitaire pour analyser les données Instagram"""
    
    @staticmethod
    def get_message_statistics(messages_df: pd.DataFrame) -> Dict[str, Any]:
        """Calcule des statistiques détaillées sur les messages"""
        if messages_df.empty:
            return {}
        
        stats = {
            'total_messages': len(messages_df),
            'unique_conversations': messages_df['conversation'].nunique() if 'conversation' in messages_df.columns else 0,
            'unique_senders': messages_df['sender'].nunique() if 'sender' in messages_df.columns else 0,
        }
        
        # Statistiques temporelles
        if 'date' in messages_df.columns:
            messages_df['date'] = pd.to_datetime(messages_df['date'], errors='coerce')
            valid_dates = messages_df.dropna(subset=['date'])
            
            if not valid_dates.empty:
                stats.update({
                    'date_range': {
                        'start': valid_dates['date'].min(),
                        'end': valid_dates['date'].max(),
                        'span_days': (valid_dates['date'].max() - valid_dates['date'].min()).days
                    },
                    'messages_per_day': len(valid_dates) / max(1, (valid_dates['date'].max() - valid_dates['date'].min()).days),
                    'most_active_day': valid_dates['date'].dt.day_name().mode().iloc[0] if not valid_dates.empty else None,
                    'most_active_hour': valid_dates['date'].dt.hour.mode().iloc[0] if not valid_dates.empty else None
                })
        
        return stats
    
    @staticmethod
    def analyze_conversation_patterns(messages_df: pd.DataFrame) -> pd.DataFrame:
        """Analyse les patterns de conversation"""
        if messages_df.empty or 'conversation' not in messages_df.columns:
            return pd.DataFrame()
        
        conv_stats = messages_df.groupby('conversation').agg({
            'message': 'count',
            'date': ['min', 'max'] if 'date' in messages_df.columns else 'count'
        }).round(2)
        
        conv_stats.columns = ['message_count', 'first_message', 'last_message'] if 'date' in messages_df.columns else ['message_count']
        
        return conv_stats.sort_values('message_count', ascending=False)
    
    @staticmethod
    def get_activity_heatmap_data(messages_df: pd.DataFrame) -> pd.DataFrame:
        """Prépare les données pour une heatmap d'activité"""
        if messages_df.empty or 'date' not in messages_df.columns:
            return pd.DataFrame()
        
        messages_df['date'] = pd.to_datetime(messages_df['date'], errors='coerce')
        valid_messages = messages_df.dropna(subset=['date'])
        
        if valid_messages.empty:
            return pd.DataFrame()
        
        valid_messages['hour'] = valid_messages['date'].dt.hour
        valid_messages['day_of_week'] = valid_messages['date'].dt.day_name()
        
        heatmap_data = valid_messages.groupby(['day_of_week', 'hour']).size().unstack(fill_value=0)
        
        # Réordonner les jours de la semaine
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        heatmap_data = heatmap_data.reindex(day_order, fill_value=0)
        
        return heatmap_data
    
    @staticmethod
    def generate_word_cloud(messages_df: pd.DataFrame, max_words: int = 100) -> Optional[WordCloud]:
        """Génère un nuage de mots à partir des messages"""
        if messages_df.empty or 'message' not in messages_df.columns:
            return None
        
        # Concaténer tous les messages
        all_text = ' '.join(messages_df['message'].dropna().astype(str))
        
        if not all_text.strip():
            return None
        
        # Nettoyer le texte
        cleaned_text = re.sub(r'http\S+|www.\S+|https\S+', '', all_text)  # Supprimer URLs
        cleaned_text = re.sub(r'@\w+|#\w+', '', cleaned_text)  # Supprimer mentions et hashtags
        cleaned_text = re.sub(r'[^a-zA-Z\s]', '', cleaned_text)  # Garder seulement lettres et espaces
        
        if not cleaned_text.strip():
            return None
        
        try:
            wordcloud = WordCloud(
                width=800,
                height=400,
                background_color='white',
                max_words=max_words,
                relative_scaling=0.5,
                colormap='viridis'
            ).generate(cleaned_text)
            
            return wordcloud
        except Exception as e:
            print(f"Erreur lors de la génération du nuage de mots: {e}")
            return None
    
    @staticmethod
    def calculate_engagement_metrics(likes_df: pd.DataFrame, comments_df: pd.DataFrame, posts_df: pd.DataFrame) -> Dict[str, float]:
        """Calcule les métriques d'engagement"""
        metrics = {
            'total_likes_given': len(likes_df),
            'total_comments_made': len(comments_df),
            'total_posts': len(posts_df),
        }
        
        if len(posts_df) > 0:
            metrics['avg_engagement_per_post'] = (len(likes_df) + len(comments_df)) / len(posts_df)
        else:
            metrics['avg_engagement_per_post'] = 0
        
        return metrics
    
    @staticmethod
    def analyze_follower_growth(followers_data: List[Dict], date_column: str = 'date_found') -> pd.DataFrame:
        """Analyse la croissance des followers (si plusieurs exports dans le temps)"""
        if not followers_data:
            return pd.DataFrame()
        
        df = pd.DataFrame(followers_data)
        if date_column not in df.columns:
            return df
        
        df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
        df = df.dropna(subset=[date_column])
        
        # Compter les followers par date
        growth = df.groupby(df[date_column].dt.date).size().cumsum()
        
        return growth.to_frame('cumulative_followers')
    
    @staticmethod
    def get_top_interactions(messages_df: pd.DataFrame, top_n: int = 10) -> Dict[str, pd.Series]:
        """Obtient les top interactions par différentes métriques"""
        results = {}
        
        if 'conversation' in messages_df.columns:
            results['top_conversations'] = messages_df['conversation'].value_counts().head(top_n)
        
        if 'sender' in messages_df.columns:
            results['top_senders'] = messages_df['sender'].value_counts().head(top_n)
        
        return results
    
    @staticmethod
    def detect_patterns_and_insights(data: Dict[str, pd.DataFrame]) -> List[str]:
        """Détecte des patterns intéressants dans les données et génère des insights"""
        insights = []
        
        messages_df = data.get('messages', pd.DataFrame())
        followers_df = data.get('followers', pd.DataFrame())
        following_df = data.get('following', pd.DataFrame())
        
        # Insights sur les messages
        if not messages_df.empty:
            total_messages = len(messages_df)
            insights.append(f"📊 Vous avez échangé {total_messages:,} messages au total")
            
            if 'conversation' in messages_df.columns:
                unique_conversations = messages_df['conversation'].nunique()
                avg_messages_per_conv = total_messages / unique_conversations if unique_conversations > 0 else 0
                insights.append(f"💬 Vous avez {unique_conversations} conversations actives avec une moyenne de {avg_messages_per_conv:.1f} messages par conversation")
            
            # Analyse temporelle
            if 'date' in messages_df.columns:
                messages_df['date'] = pd.to_datetime(messages_df['date'], errors='coerce')
                valid_dates = messages_df.dropna(subset=['date'])
                
                if not valid_dates.empty:
                    date_range = (valid_dates['date'].max() - valid_dates['date'].min()).days
                    if date_range > 0:
                        daily_avg = len(valid_dates) / date_range
                        insights.append(f"📅 Vous envoyez en moyenne {daily_avg:.1f} messages par jour")
                    
                    # Jour le plus actif
                    most_active_day = valid_dates['date'].dt.day_name().mode()
                    if not most_active_day.empty:
                        insights.append(f"🗓️ Votre jour le plus actif est le {most_active_day.iloc[0]}")
                    
                    # Heure la plus active
                    most_active_hour = valid_dates['date'].dt.hour.mode()
                    if not most_active_hour.empty:
                        insights.append(f"⏰ Vous êtes le plus actif vers {most_active_hour.iloc[0]}h")
        
        # Insights sur les connexions
        if not followers_df.empty and not following_df.empty:
            followers_count = len(followers_df)
            following_count = len(following_df)
            ratio = following_count / followers_count if followers_count > 0 else 0
            
            insights.append(f"👥 Vous avez {followers_count:,} followers et suivez {following_count:,} comptes")
            
            if ratio < 0.5:
                insights.append(f"🌟 Vous avez un bon ratio d'engagement (vous suivez moins de personnes que vous n'avez de followers)")
            elif ratio > 2:
                insights.append(f"🤝 Vous êtes très actif dans le suivi de nouveaux comptes")
            else:
                insights.append(f"⚖️ Vous avez un ratio équilibré entre followers et following")
        
        return insights


class DataExporter:
    """Classe utilitaire pour exporter les analyses"""
    
    @staticmethod
    def export_to_csv(dataframes: Dict[str, pd.DataFrame], output_dir: str = "exports"):
        """Exporte les DataFrames vers des fichiers CSV"""
        import os
        
        os.makedirs(output_dir, exist_ok=True)
        
        for name, df in dataframes.items():
            if not df.empty:
                filename = f"{output_dir}/{name}_analysis.csv"
                df.to_csv(filename, index=False, encoding='utf-8')
                print(f"✅ {name} exporté vers {filename}")
    
    @staticmethod
    def generate_summary_report(data: Dict[str, pd.DataFrame], insights: List[str]) -> str:
        """Génère un rapport de synthèse en texte"""
        report = []
        report.append("=" * 50)
        report.append("RAPPORT D'ANALYSE INSTAGRAM")
        report.append("=" * 50)
        report.append(f"Généré le : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Statistiques générales
        report.append("STATISTIQUES GÉNÉRALES")
        report.append("-" * 25)
        for name, df in data.items():
            if not df.empty:
                report.append(f"{name.title()}: {len(df):,} éléments")
        report.append("")
        
        # Insights
        report.append("INSIGHTS PRINCIPAUX")
        report.append("-" * 20)
        for insight in insights:
            report.append(f"• {insight}")
        report.append("")
        
        return "\n".join(report)