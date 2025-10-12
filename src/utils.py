"""
Utilitaires pour les filtres temporels et la gestion des données
"""
import pandas as pd
import streamlit as st
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict, Any
import pytz


class DateFilterManager:
    """Gestionnaire des filtres temporels pour l'analyse des données Instagram"""
    
    def __init__(self):
        self.timezone = pytz.timezone('Europe/Paris')  # Timezone par défaut
    
    def get_filter_options(self) -> Dict[str, str]:
        """Retourne les options de filtrage disponibles"""
        return {
            "Toutes les données": "all",
            "Dernière heure": "1h",
            "Dernier jour": "1d", 
            "Dernière semaine": "1w",
            "Dernier mois": "1m",
            "Dernière année": "1y",
            "Plage personnalisée": "custom"
        }
    
    def create_date_filter_ui(self, key_prefix: str = "") -> Tuple[str, Optional[datetime], Optional[datetime]]:
        """
        Crée l'interface utilisateur pour les filtres de date
        
        Returns:
            Tuple[filter_type, start_date, end_date]
        """
        st.sidebar.markdown("### 📅 Filtres temporels")
        
        filter_options = self.get_filter_options()
        selected_filter = st.sidebar.selectbox(
            "Période d'analyse",
            list(filter_options.keys()),
            key=f"{key_prefix}_date_filter"
        )
        
        filter_type = filter_options[selected_filter]
        start_date, end_date = None, None
        
        if filter_type == "custom":
            col1, col2 = st.sidebar.columns(2)
            with col1:
                start_date = st.date_input(
                    "Date de début",
                    value=datetime.now() - timedelta(days=30),
                    key=f"{key_prefix}_start_date"
                )
            with col2:
                end_date = st.date_input(
                    "Date de fin",
                    value=datetime.now(),
                    key=f"{key_prefix}_end_date"
                )
            
            # Convertir en datetime
            if start_date:
                start_date = datetime.combine(start_date, datetime.min.time())
            if end_date:
                end_date = datetime.combine(end_date, datetime.max.time())
        
        elif filter_type != "all":
            end_date = datetime.now()
            
            if filter_type == "1h":
                start_date = end_date - timedelta(hours=1)
            elif filter_type == "1d":
                start_date = end_date - timedelta(days=1)
            elif filter_type == "1w":
                start_date = end_date - timedelta(weeks=1)
            elif filter_type == "1m":
                start_date = end_date - timedelta(days=30)
            elif filter_type == "1y":
                start_date = end_date - timedelta(days=365)
        
        return filter_type, start_date, end_date
    
    def filter_dataframe_by_date(self, df: pd.DataFrame, start_date: Optional[datetime], 
                                end_date: Optional[datetime], date_column: str = 'timestamp') -> pd.DataFrame:
        """
        Filtre un DataFrame selon une plage de dates
        
        Args:
            df: DataFrame à filtrer
            start_date: Date de début (optionnelle)
            end_date: Date de fin (optionnelle)
            date_column: Nom de la colonne contenant les dates
        
        Returns:
            DataFrame filtré
        """
        if df.empty or (start_date is None and end_date is None):
            return df
        
        # Vérifier si la colonne existe
        if date_column not in df.columns:
            # Essayer des noms alternatifs courants
            alternative_columns = ['date', 'creation_timestamp', 'timestamp', 'datetime']
            date_column = next((col for col in alternative_columns if col in df.columns), None)
            
            if date_column is None:
                st.warning(f"Aucune colonne de date trouvée dans les données")
                return df
        
        df_filtered = df.copy()
        
        # Convertir la colonne en datetime si nécessaire
        if not pd.api.types.is_datetime64_any_dtype(df_filtered[date_column]):
            # Essayer de convertir depuis timestamp unix
            try:
                df_filtered[date_column] = pd.to_datetime(df_filtered[date_column], unit='s')
            except:
                try:
                    df_filtered[date_column] = pd.to_datetime(df_filtered[date_column])
                except:
                    st.warning(f"Impossible de convertir la colonne {date_column} en date")
                    return df
        
        # Appliquer les filtres
        if start_date is not None:
            df_filtered = df_filtered[df_filtered[date_column] >= start_date]
        
        if end_date is not None:
            df_filtered = df_filtered[df_filtered[date_column] <= end_date]
        
        return df_filtered
    
    def get_date_summary(self, df: pd.DataFrame, date_column: str = 'timestamp') -> Dict[str, Any]:
        """
        Retourne un résumé des dates dans le DataFrame
        
        Returns:
            Dictionnaire avec min_date, max_date, count, period_days
        """
        if df.empty or date_column not in df.columns:
            return {
                'min_date': None,
                'max_date': None,
                'count': 0,
                'period_days': 0
            }
        
        # Convertir en datetime si nécessaire
        dates = df[date_column].copy()
        if not pd.api.types.is_datetime64_any_dtype(dates):
            try:
                dates = pd.to_datetime(dates, unit='s')
            except:
                try:
                    dates = pd.to_datetime(dates)
                except:
                    return {
                        'min_date': None,
                        'max_date': None,
                        'count': len(df),
                        'period_days': 0
                    }
        
        dates = dates.dropna()
        if dates.empty:
            return {
                'min_date': None,
                'max_date': None,
                'count': len(df),
                'period_days': 0
            }
        
        min_date = dates.min()
        max_date = dates.max()
        period_days = (max_date - min_date).days if min_date and max_date else 0
        
        return {
            'min_date': min_date,
            'max_date': max_date,
            'count': len(df),
            'period_days': period_days
        }
    
    def display_filter_summary(self, df_original: pd.DataFrame, df_filtered: pd.DataFrame, 
                              date_column: str = 'timestamp'):
        """
        Affiche un résumé des filtres appliqués
        """
        if df_original.empty:
            return
        
        original_summary = self.get_date_summary(df_original, date_column)
        filtered_summary = self.get_date_summary(df_filtered, date_column)
        
        if original_summary['count'] == 0:
            return
        
        # Calcul du pourcentage
        percentage = (filtered_summary['count'] / original_summary['count']) * 100
        
        # Affichage
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 📊 Résumé du filtrage")
        st.sidebar.metric(
            "Éléments affichés", 
            f"{filtered_summary['count']:,}",
            f"{percentage:.1f}% du total"
        )
        
        if filtered_summary['min_date'] and filtered_summary['max_date']:
            st.sidebar.write(f"**Période :** {filtered_summary['min_date'].strftime('%d/%m/%Y')} - {filtered_summary['max_date'].strftime('%d/%m/%Y')}")
            st.sidebar.write(f"**Durée :** {filtered_summary['period_days']} jours")


class ProgressManager:
    """Gestionnaire de barres de progression pour le parsing"""
    
    def __init__(self):
        self.progress_bar = None
        self.status_text = None
        self.current_step = 0
        self.total_steps = 0
    
    def initialize_progress(self, total_steps: int, title: str = "Chargement des données..."):
        """Initialise la barre de progression"""
        self.total_steps = total_steps
        self.current_step = 0
        
        st.markdown(f"### {title}")
        self.progress_bar = st.progress(0)
        self.status_text = st.empty()
        
        return self
    
    def update_progress(self, step_name: str, increment: int = 1):
        """Met à jour la barre de progression"""
        self.current_step += increment
        progress_percentage = min(self.current_step / self.total_steps, 1.0)
        
        if self.progress_bar:
            self.progress_bar.progress(progress_percentage)
        
        if self.status_text:
            self.status_text.text(f"📊 {step_name} ({self.current_step}/{self.total_steps})")
    
    def complete_progress(self, message: str = "✅ Chargement terminé !"):
        """Termine la barre de progression"""
        if self.progress_bar:
            self.progress_bar.progress(1.0)
        
        if self.status_text:
            self.status_text.success(message)
    
    def cleanup_progress(self):
        """Nettoie les éléments de progression"""
        if self.progress_bar:
            self.progress_bar.empty()
        if self.status_text:
            self.status_text.empty()