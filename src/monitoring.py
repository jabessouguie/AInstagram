"""
Dashboard de monitoring et contrôle des performances
Analyse des coûts, utilisation des ressources et métriques
"""

import streamlit as st
import psutil
import time
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any
from pathlib import Path
import json


class PerformanceMonitor:
    """Moniteur de performances système"""
    
    def __init__(self, cache_dir: str = ".cache/metrics"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_file = self.cache_dir / "performance_metrics.json"
        self.load_metrics()
    
    def load_metrics(self):
        """Charge les métriques sauvegardées"""
        if self.metrics_file.exists():
            with open(self.metrics_file, 'r') as f:
                self.metrics = json.load(f)
        else:
            self.metrics = {
                'system': [],
                'cache': [],
                'parsing': [],
                'users': [],
            }
    
    def save_metrics(self):
        """Sauvegarde les métriques"""
        with open(self.metrics_file, 'w') as f:
            json.dump(self.metrics, f, indent=2)
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Récupère les métriques système actuelles"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'cpu': {
                'percent': cpu_percent,
                'count': psutil.cpu_count(),
            },
            'memory': {
                'total_gb': memory.total / (1024**3),
                'used_gb': memory.used / (1024**3),
                'percent': memory.percent,
                'available_gb': memory.available / (1024**3),
            },
            'disk': {
                'total_gb': disk.total / (1024**3),
                'used_gb': disk.used / (1024**3),
                'free_gb': disk.free / (1024**3),
                'percent': disk.percent,
            },
        }
        
        # Enregistrer dans l'historique
        self.metrics['system'].append(metrics)
        
        # Garder seulement les 100 dernières mesures
        if len(self.metrics['system']) > 100:
            self.metrics['system'] = self.metrics['system'][-100:]
        
        self.save_metrics()
        return metrics
    
    def get_cache_metrics(self) -> Dict[str, Any]:
        """Récupère les métriques du cache"""
        cache_path = Path('.cache')
        
        if not cache_path.exists():
            return {
                'size_mb': 0,
                'files_count': 0,
                'oldest_file': None,
                'newest_file': None,
            }
        
        total_size = 0
        files = []
        
        for file_path in cache_path.rglob('*'):
            if file_path.is_file():
                size = file_path.stat().st_size
                total_size += size
                files.append({
                    'path': str(file_path),
                    'size': size,
                    'mtime': file_path.stat().st_mtime,
                })
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'size_mb': total_size / (1024**2),
            'files_count': len(files),
            'oldest_file': min([f['mtime'] for f in files]) if files else None,
            'newest_file': max([f['mtime'] for f in files]) if files else None,
        }
        
        self.metrics['cache'].append(metrics)
        if len(self.metrics['cache']) > 100:
            self.metrics['cache'] = self.metrics['cache'][-100:]
        
        self.save_metrics()
        return metrics
    
    def record_parsing_metrics(self, duration: float, folders_count: int, items_parsed: Dict[str, int]):
        """Enregistre les métriques de parsing"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration,
            'folders_count': folders_count,
            'items_parsed': items_parsed,
            'items_per_second': sum(items_parsed.values()) / duration if duration > 0 else 0,
        }
        
        self.metrics['parsing'].append(metrics)
        if len(self.metrics['parsing']) > 50:
            self.metrics['parsing'] = self.metrics['parsing'][-50:]
        
        self.save_metrics()
    
    def record_user_action(self, action: str, section: str, duration: float = 0):
        """Enregistre une action utilisateur"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'section': section,
            'duration_seconds': duration,
        }
        
        self.metrics['users'].append(metrics)
        if len(self.metrics['users']) > 500:
            self.metrics['users'] = self.metrics['users'][-500:]
        
        self.save_metrics()
    
    def get_cost_estimation(self) -> Dict[str, float]:
        """Estime les coûts d'utilisation (pour cloud/SaaS)"""
        # Coûts moyens AWS par exemple
        cpu_cost_per_hour = 0.05  # Prix indicatif
        memory_gb_cost_per_hour = 0.01  # Prix indicatif
        storage_gb_cost_per_month = 0.023  # Prix indicatif
        
        metrics = self.get_system_metrics()
        cache_metrics = self.get_cache_metrics()
        
        # Calcul des coûts horaires
        cpu_hours = metrics['cpu']['percent'] / 100
        memory_gb = metrics['memory']['used_gb']
        storage_gb = cache_metrics['size_mb'] / 1024
        
        costs = {
            'cpu_hourly': cpu_hours * cpu_cost_per_hour,
            'memory_hourly': memory_gb * memory_gb_cost_per_hour,
            'storage_monthly': storage_gb * storage_gb_cost_per_month,
            'total_hourly': (cpu_hours * cpu_cost_per_hour) + (memory_gb * memory_gb_cost_per_hour),
            'estimated_monthly': ((cpu_hours * cpu_cost_per_hour) + (memory_gb * memory_gb_cost_per_hour)) * 24 * 30 + (storage_gb * storage_gb_cost_per_month),
        }
        
        return costs


def display_monitoring_dashboard():
    """Affiche le dashboard de monitoring"""
    from src.ui_components import section_header, metric_card, info_box, progress_bar
    from src.design_system import COLORS
    
    st.title("🎛️ Dashboard de Monitoring")
    
    # Initialiser le moniteur
    monitor = PerformanceMonitor()
    
    # Tabs pour organiser le dashboard
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Vue d'ensemble",
        "💻 Système",
        "🗄️ Cache",
        "⚡ Performances",
        "💰 Coûts"
    ])
    
    with tab1:
        section_header("Vue d'ensemble du système", "Métriques en temps réel")
        
        # Métriques système
        system_metrics = monitor.get_system_metrics()
        cache_metrics = monitor.get_cache_metrics()
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            metric_card(
                "CPU",
                f"{system_metrics['cpu']['percent']:.1f}%",
                icon="💻",
                color="primary"
            )
        
        with col2:
            metric_card(
                "RAM",
                f"{system_metrics['memory']['used_gb']:.1f} GB",
                delta=f"{system_metrics['memory']['percent']:.1f}%",
                icon="🧠"
            )
        
        with col3:
            metric_card(
                "Disque",
                f"{system_metrics['disk']['used_gb']:.0f} GB",
                delta=f"{system_metrics['disk']['percent']:.1f}%",
                icon="💾"
            )
        
        with col4:
            metric_card(
                "Cache",
                f"{cache_metrics['size_mb']:.1f} MB",
                delta=f"{cache_metrics['files_count']} fichiers",
                icon="🗄️"
            )
        
        # Statut global
        st.markdown("---")
        col1, col2 = st.columns(2)
        
        with col1:
            if system_metrics['cpu']['percent'] < 70:
                info_box("✅ Système opérationnel - Performances optimales", "success")
            elif system_metrics['cpu']['percent'] < 85:
                info_box("⚠️ Charge modérée - Performances acceptables", "warning")
            else:
                info_box("❌ Charge élevée - Performances réduites", "danger")
        
        with col2:
            if system_metrics['memory']['percent'] < 70:
                info_box("✅ Mémoire disponible - Aucun problème", "success")
            elif system_metrics['memory']['percent'] < 85:
                info_box("⚠️ Mémoire limitée - Surveiller l'utilisation", "warning")
            else:
                info_box("❌ Mémoire saturée - Libérer de la RAM", "danger")
    
    with tab2:
        section_header("Ressources système", "Détails d'utilisation")
        
        system_metrics = monitor.get_system_metrics()
        
        # CPU
        st.subheader("🔥 Processeur (CPU)")
        col1, col2 = st.columns([3, 1])
        with col1:
            progress_bar(system_metrics['cpu']['percent'], "Utilisation CPU")
        with col2:
            st.metric("Cœurs", system_metrics['cpu']['count'])
        
        # Mémoire
        st.subheader("🧠 Mémoire (RAM)")
        col1, col2 = st.columns([3, 1])
        with col1:
            progress_bar(system_metrics['memory']['percent'], "Utilisation RAM")
        with col2:
            st.metric(
                "Total",
                f"{system_metrics['memory']['total_gb']:.1f} GB"
            )
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Utilisée", f"{system_metrics['memory']['used_gb']:.1f} GB")
        with col2:
            st.metric("Disponible", f"{system_metrics['memory']['available_gb']:.1f} GB")
        with col3:
            st.metric("Pourcentage", f"{system_metrics['memory']['percent']:.1f}%")
        
        # Disque
        st.subheader("💾 Espace Disque")
        col1, col2 = st.columns([3, 1])
        with col1:
            progress_bar(system_metrics['disk']['percent'], "Utilisation Disque")
        with col2:
            st.metric(
                "Total",
                f"{system_metrics['disk']['total_gb']:.0f} GB"
            )
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Utilisé", f"{system_metrics['disk']['used_gb']:.0f} GB")
        with col2:
            st.metric("Libre", f"{system_metrics['disk']['free_gb']:.0f} GB")
        with col3:
            st.metric("Pourcentage", f"{system_metrics['disk']['percent']:.1f}%")
        
        # Historique
        if len(monitor.metrics['system']) > 1:
            st.subheader("📈 Historique d'utilisation")
            
            df_history = pd.DataFrame([
                {
                    'timestamp': m['timestamp'],
                    'CPU (%)': m['cpu']['percent'],
                    'RAM (%)': m['memory']['percent'],
                    'Disque (%)': m['disk']['percent'],
                }
                for m in monitor.metrics['system'][-50:]
            ])
            
            df_history['timestamp'] = pd.to_datetime(df_history['timestamp'])
            df_history = df_history.set_index('timestamp')
            
            st.line_chart(df_history)
    
    with tab3:
        section_header("Cache et stockage", "Gestion des fichiers temporaires")
        
        cache_metrics = monitor.get_cache_metrics()
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Taille totale", f"{cache_metrics['size_mb']:.2f} MB")
        with col2:
            st.metric("Nombre de fichiers", cache_metrics['files_count'])
        with col3:
            if cache_metrics['oldest_file']:
                age_days = (time.time() - cache_metrics['oldest_file']) / 86400
                st.metric("Fichier le plus ancien", f"{age_days:.1f} jours")
        
        st.markdown("---")
        
        # Actions de gestion
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🗑️ Vider le cache", type="primary"):
                import shutil
                shutil.rmtree('.cache', ignore_errors=True)
                st.success("Cache vidé avec succès !")
                st.rerun()
        
        with col2:
            if st.button("🔄 Rafraîchir les métriques"):
                st.rerun()
    
    with tab4:
        section_header("Performances de parsing", "Métriques d'analyse des données")
        
        if monitor.metrics['parsing']:
            df_parsing = pd.DataFrame(monitor.metrics['parsing'])
            df_parsing['timestamp'] = pd.to_datetime(df_parsing['timestamp'])
            
            # Statistiques
            col1, col2, col3 = st.columns(3)
            with col1:
                avg_duration = df_parsing['duration_seconds'].mean()
                st.metric("Durée moyenne", f"{avg_duration:.1f}s")
            with col2:
                avg_speed = df_parsing['items_per_second'].mean()
                st.metric("Vitesse moyenne", f"{avg_speed:.0f} items/s")
            with col3:
                total_parses = len(df_parsing)
                st.metric("Total de parsing", total_parses)
            
            # Graphiques
            st.subheader("📊 Évolution des performances")
            st.line_chart(df_parsing.set_index('timestamp')['duration_seconds'])
            
            st.subheader("⚡ Vitesse de parsing")
            st.line_chart(df_parsing.set_index('timestamp')['items_per_second'])
        else:
            info_box("Aucune métrique de parsing disponible pour le moment", "info")
    
    with tab5:
        section_header("Estimation des coûts", "Coûts d'infrastructure (Cloud/SaaS)")
        
        costs = monitor.get_cost_estimation()
        
        info_box(
            "💡 Ces estimations sont basées sur des tarifs moyens AWS. "
            "Les coûts réels peuvent varier selon votre fournisseur et configuration.",
            "info"
        )
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("💻 CPU (horaire)", f"${costs['cpu_hourly']:.4f}")
        with col2:
            st.metric("🧠 RAM (horaire)", f"${costs['memory_hourly']:.4f}")
        with col3:
            st.metric("💾 Stockage (mensuel)", f"${costs['storage_monthly']:.2f}")
        
        st.markdown("---")
        
        col1, col2 = st.columns(2)
        with col1:
            metric_card(
                "Coût Horaire Total",
                f"${costs['total_hourly']:.4f}",
                icon="⏱️"
            )
        with col2:
            metric_card(
                "Estimation Mensuelle",
                f"${costs['estimated_monthly']:.2f}",
                icon="📅"
            )
        
        st.markdown("---")
        
        # Simulateur de coûts
        st.subheader("🧮 Simulateur de coûts")
        
        col1, col2 = st.columns(2)
        with col1:
            users_count = st.number_input("Nombre d'utilisateurs", min_value=1, max_value=10000, value=10)
            usage_hours = st.slider("Heures d'utilisation/jour", 1, 24, 8)
        
        with col2:
            data_size_gb = st.number_input("Taille des données (GB)", min_value=1, max_value=1000, value=10)
            retention_days = st.slider("Rétention des données (jours)", 7, 90, 30)
        
        # Calculs
        estimated_daily = costs['total_hourly'] * usage_hours * users_count
        estimated_monthly = estimated_daily * 30
        estimated_storage = data_size_gb * 0.023 * (retention_days / 30)
        
        st.markdown("### 📊 Résultats")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Coût journalier", f"${estimated_daily:.2f}")
        with col2:
            st.metric("Coût mensuel", f"${estimated_monthly:.2f}")
        with col3:
            st.metric("Coût stockage", f"${estimated_storage:.2f}")
        
        total_monthly = estimated_monthly + estimated_storage
        st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            color: white;
            margin-top: 1rem;
        ">
            <h2 style="margin: 0; color: white;">Coût Total Estimé</h2>
            <h1 style="margin: 0.5rem 0; font-size: 3rem; color: white;">${total_monthly:.2f}/mois</h1>
            <p style="margin: 0; opacity: 0.9;">Pour {users_count} utilisateurs avec {data_size_gb} GB de données</p>
        </div>
        """, unsafe_allow_html=True)


if __name__ == "__main__":
    display_monitoring_dashboard()
