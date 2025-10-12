"""
Gestionnaire de cache et optimisation des performances pour éviter les timeouts
"""
import pickle
import hashlib
import time
from pathlib import Path
from typing import Any, Optional, Dict, Callable
import streamlit as st
from datetime import datetime, timedelta


class CacheManager:
    """Gestionnaire de cache pour les données Instagram parsées"""
    
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.cache_metadata = {}
        self.default_ttl = 3600  # 1 heure par défaut
    
    def _generate_cache_key(self, data_path: str, parser_config: Dict) -> str:
        """Génère une clé de cache unique basée sur le chemin et la config"""
        content = f"{data_path}_{str(parser_config)}_{self._get_folder_modification_time(data_path)}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_folder_modification_time(self, data_path: str) -> float:
        """Obtient le temps de modification le plus récent du dossier"""
        data_folder = Path(data_path)
        if not data_folder.exists():
            return 0
        
        max_mtime = 0
        for item in data_folder.rglob("*"):
            if item.is_file():
                max_mtime = max(max_mtime, item.stat().st_mtime)
        
        return max_mtime
    
    def _is_cache_valid(self, cache_file: Path, ttl: int) -> bool:
        """Vérifie si le cache est encore valide"""
        if not cache_file.exists():
            return False
        
        cache_age = time.time() - cache_file.stat().st_mtime
        return cache_age < ttl
    
    def get_cached_data(self, data_path: str, parser_config: Dict, ttl: int = None) -> Optional[Any]:
        """Récupère les données depuis le cache si disponibles et valides"""
        if ttl is None:
            ttl = self.default_ttl
        
        cache_key = self._generate_cache_key(data_path, parser_config)
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        
        if self._is_cache_valid(cache_file, ttl):
            try:
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                st.warning(f"Erreur lors de la lecture du cache : {e}")
                # Supprimer le cache corrompu
                cache_file.unlink(missing_ok=True)
        
        return None
    
    def save_to_cache(self, data: Any, data_path: str, parser_config: Dict) -> bool:
        """Sauvegarde les données dans le cache"""
        try:
            cache_key = self._generate_cache_key(data_path, parser_config)
            cache_file = self.cache_dir / f"{cache_key}.pkl"
            
            with open(cache_file, 'wb') as f:
                pickle.dump(data, f)
            
            return True
        except Exception as e:
            st.warning(f"Erreur lors de la sauvegarde du cache : {e}")
            return False
    
    def clear_cache(self) -> int:
        """Efface tout le cache et retourne le nombre de fichiers supprimés"""
        deleted_count = 0
        for cache_file in self.cache_dir.glob("*.pkl"):
            try:
                cache_file.unlink()
                deleted_count += 1
            except Exception:
                pass
        
        return deleted_count
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Retourne des informations sur le cache"""
        cache_files = list(self.cache_dir.glob("*.pkl"))
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            'cache_files': len(cache_files),
            'total_size_mb': total_size / (1024 * 1024),
            'cache_dir': str(self.cache_dir)
        }


class AsyncDataLoader:
    """Chargeur de données asynchrone avec gestion des timeouts"""
    
    def __init__(self, cache_manager: CacheManager):
        self.cache_manager = cache_manager
        self.loading_timeout = 300  # 5 minutes
    
    @st.cache_data(ttl=3600, show_spinner=False)
    def load_data_with_cache(_self, data_path: str, use_threading: bool = True, 
                           force_refresh: bool = False) -> Optional[Dict]:
        """
        Charge les données avec cache et gestion des timeouts
        
        Args:
            data_path: Chemin vers les données Instagram
            use_threading: Utiliser le threading pour le parsing
            force_refresh: Forcer le rechargement sans utiliser le cache
        
        Returns:
            Dictionnaire avec les données parsées ou None si échec
        """
        parser_config = {'use_threading': use_threading}
        
        # Essayer de récupérer depuis le cache d'abord
        if not force_refresh:
            cached_data = _self.cache_manager.get_cached_data(data_path, parser_config)
            if cached_data is not None:
                return cached_data
        
        # Si pas de cache, parser les données
        try:
            from .data_parser import InstagramDataParser
            
            parser = InstagramDataParser(data_path, use_threading=use_threading)
            
            # Utiliser un timeout pour éviter les blocages
            start_time = time.time()
            data = parser.parse_all_data()
            parsing_time = time.time() - start_time
            
            if parsing_time > _self.loading_timeout:
                st.warning("Le parsing a pris plus de temps que prévu, certaines données peuvent être incomplètes.")
            
            # Convertir en DataFrames
            dataframes = parser.to_dataframes()
            
            result = {
                'raw': data,
                'dataframes': dataframes,
                'parsing_time': parsing_time,
                'timestamp': datetime.now().isoformat()
            }
            
            # Sauvegarder dans le cache
            _self.cache_manager.save_to_cache(result, data_path, parser_config)
            
            return result
            
        except Exception as e:
            st.error(f"Erreur lors du chargement des données : {e}")
            return None
    
    def load_data_with_progress(self, data_path: str, use_threading: bool = True,
                              force_refresh: bool = False) -> Optional[Dict]:
        """
        Charge les données avec une barre de progression détaillée
        """
        from .utils import ProgressManager
        
        # Vérifier le cache d'abord
        parser_config = {'use_threading': use_threading}
        cached_data = None
        
        if not force_refresh:
            cached_data = self.cache_manager.get_cached_data(data_path, parser_config)
        
        if cached_data is not None:
            st.success("✅ Données chargées depuis le cache !")
            return cached_data
        
        # Initialiser la progression
        progress = ProgressManager()
        
        # Estimer le nombre d'étapes basé sur le nombre de dossiers
        data_folder = Path(data_path)
        instagram_folders = list(data_folder.glob("instagram-*")) if data_folder.exists() else []
        estimated_steps = len(instagram_folders) + 3  # +3 pour init, dataframes, cache
        
        progress.initialize_progress(estimated_steps, "🔄 Chargement des données Instagram")
        
        try:
            from .data_parser import InstagramDataParser
            
            progress.update_progress("Initialisation du parser")
            parser = InstagramDataParser(data_path, use_threading=use_threading)
            
            # Hook pour suivre le progrès du parsing
            original_parse_folder = parser._parse_folder
            
            def progress_parse_folder(folder_path):
                folder_name = folder_path.name if hasattr(folder_path, 'name') else str(folder_path).split('/')[-1]
                progress.update_progress(f"Parsing {folder_name[:20]}...")
                return original_parse_folder(folder_path)
            
            parser._parse_folder = progress_parse_folder
            
            # Parser les données
            start_time = time.time()
            data = parser.parse_all_data()
            parsing_time = time.time() - start_time
            
            progress.update_progress("Conversion en DataFrames")
            dataframes = parser.to_dataframes()
            
            progress.update_progress("Sauvegarde dans le cache")
            
            result = {
                'raw': data,
                'dataframes': dataframes,
                'parsing_time': parsing_time,
                'timestamp': datetime.now().isoformat()
            }
            
            # Sauvegarder dans le cache
            self.cache_manager.save_to_cache(result, data_path, parser_config)
            
            progress.complete_progress(f"✅ {len(instagram_folders)} dossiers parsés en {parsing_time:.1f}s")
            
            return result
            
        except Exception as e:
            progress.status_text.error(f"❌ Erreur lors du chargement : {e}")
            return None
        
        finally:
            # Nettoyer la progression après 3 secondes
            time.sleep(3)
            progress.cleanup_progress()


def create_cache_management_ui(cache_manager: CacheManager):
    """Crée l'interface de gestion du cache dans la sidebar"""
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 🗄️ Gestion du cache")
    
    cache_info = cache_manager.get_cache_info()
    
    st.sidebar.write(f"**Fichiers en cache :** {cache_info['cache_files']}")
    st.sidebar.write(f"**Taille totale :** {cache_info['total_size_mb']:.1f} MB")
    
    col1, col2 = st.sidebar.columns(2)
    
    with col1:
        if st.button("🔄 Actualiser", help="Force le rechargement des données"):
            st.session_state.force_refresh = True
            st.rerun()
    
    with col2:
        if st.button("🗑️ Vider cache", help="Supprime tous les fichiers de cache"):
            deleted = cache_manager.clear_cache()
            st.sidebar.success(f"✅ {deleted} fichiers supprimés")
            st.rerun()