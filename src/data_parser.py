import os
import json
import pandas as pd
from bs4 import BeautifulSoup
from datetime import datetime
import re
from typing import Dict, List, Any, Optional
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time


class InstagramDataWatcher(FileSystemEventHandler):
    """Surveille les changements dans le dossier de données"""
    
    def __init__(self, parser_instance):
        self.parser = parser_instance
        self.last_modified = time.time()
    
    def on_modified(self, event):
        if not event.is_directory and time.time() - self.last_modified > 5:
            print(f"🔄 Changement détecté: {event.src_path}")
            self.parser.refresh_data()
            self.last_modified = time.time()


class InstagramDataParser:
    """Parser optimisé pour les données Instagram exportées"""
    
    def __init__(self, data_folder: str, use_threading: bool = False):
        """
        Initialize le parser avec le dossier de données
        
        Args:
            data_folder: Chemin vers le dossier contenant les données Instagram
            use_threading: Utiliser le multithreading pour accélérer le parsing (désactivé par défaut)
        """
        self.data_folder = Path(data_folder)
        
        # Désactiver le threading par défaut pour la stabilité
        self.use_threading = False  # Toujours désactivé pour éviter les problèmes
        self.in_streamlit = True    # Assumer qu'on est dans Streamlit
        self.max_workers = min(4, os.cpu_count() or 1)
        
        # Lock pour thread safety
        self._lock = threading.Lock()
        
        # Données
        self.profile_data = {}
        self.messages_data = []
        self.posts_data = []
        self.followers_data = []
        self.following_data = []
        self.stories_data = []
        self.likes_data = []
        self.comments_data = []
        self.login_activity = []
        self.ads_data = []
        self.search_history = []
        
        # Watchdog observer
        self.observer = None
        
    def parse_all_data(self) -> Dict[str, Any]:
        """Parse toutes les données Instagram disponibles avec optimisation"""
        
        instagram_folders = list(self.data_folder.glob("instagram-*"))
        
        if not instagram_folders:
            print("❌ Aucun dossier Instagram trouvé")
            return self._get_empty_result()
        
        print(f"📂 {len(instagram_folders)} dossier(s) trouvé(s)")
        print("📊 Parsing séquentiel (mode stable)")
        
        # Toujours utiliser le parsing séquentiel pour la stabilité
        for folder in instagram_folders:
            if folder.is_dir():
                try:
                    print(f"📊 Parsing {folder.name}...")
                    self._parse_folder(folder)
                    print(f"✅ {folder.name} parsé avec succès")
                except Exception as e:
                    print(f"❌ Erreur avec {folder.name}: {str(e)}")
                    # Continuer avec les autres dossiers
                    continue
        
        return {
            'profile': self.profile_data,
            'messages': self.messages_data,
            'posts': self.posts_data,
            'followers': self.followers_data,
            'following': self.following_data,
            'stories': self.stories_data,
            'likes': self.likes_data,
            'comments': self.comments_data,
            'login_activity': self.login_activity,
            'ads_data': self.ads_data,
            'search_history': self.search_history
        }
    
    def _parse_folders_threaded(self, folders: List[Path]):
        """Parse plusieurs dossiers en parallèle avec gestion d'erreurs améliorée"""
        # Parsing séquentiel pour éviter les problèmes de threading dans Streamlit
        for folder in folders:
            if folder.is_dir():
                try:
                    print(f"📊 Parsing {folder.name}...")
                    self._parse_folder(folder)
                    print(f"✅ {folder.name} parsé avec succès")
                except Exception as e:
                    print(f"❌ Erreur avec {folder.name}: {str(e)}")
                    # Continuer même en cas d'erreur sur un dossier
                    continue
    
    def _get_empty_result(self) -> Dict[str, Any]:
        """Retourne un résultat vide"""
        return {
            'profile': {},
            'messages': [],
            'posts': [],
            'followers': [],
            'following': [],
            'stories': [],
            'likes': [],
            'comments': [],
            'login_activity': [],
            'ads_data': [],
            'search_history': []
        }
    
    def start_watching(self):
        """Démarre la surveillance du dossier de données"""
        if self.observer is None:
            try:
                from watchdog.observers import Observer
                self.observer = Observer()
                event_handler = InstagramDataWatcher(self)
                self.observer.schedule(event_handler, str(self.data_folder), recursive=True)
                self.observer.start()
                print("👁️ Surveillance des fichiers activée")
            except ImportError:
                print("⚠️ Watchdog non disponible, surveillance désactivée")
    
    def stop_watching(self):
        """Arrête la surveillance"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            self.observer = None
            print("🛑 Surveillance arrêtée")
    
    def refresh_data(self):
        """Rafraîchit les données"""
        with self._lock:
            # Réinitialiser les données
            self.messages_data = []
            self.posts_data = []
            self.followers_data = []
            self.following_data = []
            self.stories_data = []
            self.likes_data = []
            self.comments_data = []
            self.login_activity = []
            self.ads_data = []
            self.search_history = []
            
            # Reparser
            self.parse_all_data()
    
    def _parse_folder(self, folder_path: Path):
        """Parse un dossier d'export Instagram spécifique"""
        
        # Parse messages
        messages_path = folder_path / "your_instagram_activity" / "messages"
        if messages_path.exists():
            self._parse_messages(messages_path)
        
        # Parse posts
        media_path = folder_path / "media"
        if media_path.exists():
            self._parse_media(media_path)
        
        # Parse followers/following
        connections_path = folder_path / "connections" / "followers_and_following"
        if connections_path.exists():
            self._parse_connections(connections_path)
        
        # Parse profile info
        personal_info_path = folder_path / "personal_information"
        if personal_info_path.exists():
            self._parse_profile_info(personal_info_path)
        
        # Parse likes
        likes_path = folder_path / "your_instagram_activity" / "likes"
        if likes_path.exists():
            self._parse_likes(likes_path)
        
        # Parse comments
        comments_path = folder_path / "your_instagram_activity" / "comments"
        if comments_path.exists():
            self._parse_comments(comments_path)
        
        # Parse login activity
        login_path = folder_path / "security_and_login_information" / "login_and_profile_creation"
        if login_path.exists():
            self._parse_login_activity(login_path)
    
    def _parse_messages(self, messages_path: Path):
        """Parse les messages"""
        inbox_path = messages_path / "inbox"
        if not inbox_path.exists():
            return
        
        for conversation_folder in inbox_path.iterdir():
            if conversation_folder.is_dir():
                conversation_name = conversation_folder.name
                
                # Parser chaque fichier de message dans la conversation
                for message_file in conversation_folder.glob("message_*.html"):
                    try:
                        with open(message_file, 'r', encoding='utf-8') as f:
                            soup = BeautifulSoup(f.read(), 'html.parser')
                            
                        # Extraire les messages de cette page
                        messages = self._extract_messages_from_soup(soup, conversation_name)
                        self.messages_data.extend(messages)
                    except Exception as e:
                        print(f"Error parsing {message_file}: {e}")
    
    def _extract_messages_from_soup(self, soup: BeautifulSoup, conversation_name: str) -> List[Dict]:
        """Extrait les messages d'un fichier HTML parsé"""
        messages = []
        
        # Chercher les éléments de message
        message_elements = soup.find_all('div', class_='pam')
        
        for element in message_elements:
            try:
                # Extraire le texte du message
                message_text = ""
                content_div = element.find('div', class_='_a6-p')
                if content_div:
                    text_divs = content_div.find_all('div')
                    for div in text_divs:
                        if div.get_text(strip=True):
                            message_text += div.get_text(strip=True) + " "
                
                # Extraire la date
                date_element = element.find('div', class_='_a6-o')
                date_str = ""
                if date_element:
                    date_str = date_element.get_text(strip=True)
                
                # Extraire l'expéditeur
                sender = "Unknown"
                header = element.find('h2', class_='_a6-h')
                if header:
                    sender = header.get_text(strip=True)
                
                if message_text.strip() or date_str:
                    messages.append({
                        'conversation': conversation_name,
                        'sender': sender,
                        'message': message_text.strip(),
                        'date': self._parse_date(date_str),
                        'raw_date': date_str
                    })
            except Exception as e:
                print(f"Error extracting message: {e}")
                continue
        
        return messages
    
    def _parse_media(self, media_path: Path):
        """Parse les médias (posts, stories)"""
        
        # Compter les fichiers médias directement dans le dossier media
        media_files = []
        for file_path in media_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.mp4', '.mov']:
                media_files.append({
                    'filename': file_path.name,
                    'path': str(file_path),
                    'type': 'video' if file_path.suffix.lower() in ['.mp4', '.mov'] else 'photo',
                    'size': file_path.stat().st_size,
                    'timestamp': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                })
        
        if media_files:
            self.posts_data.extend(media_files)
            print(f"✅ Trouvé {len(media_files)} fichiers médias dans {media_path.name}")
        
        # Parse posts dans sous-dossiers
        posts_path = media_path / "posts"
        if posts_path.exists():
            posts_count = 0
            for item in posts_path.iterdir():
                if item.is_dir():
                    # Compter les fichiers dans chaque dossier de date
                    folder_media = list(item.glob('*.jpg')) + list(item.glob('*.jpeg')) + list(item.glob('*.png')) + list(item.glob('*.mp4'))
                    for media_file in folder_media:
                        self.posts_data.append({
                            'filename': media_file.name,
                            'path': str(media_file),
                            'type': 'video' if media_file.suffix.lower() in ['.mp4', '.mov'] else 'photo',
                            'folder': item.name,
                            'timestamp': datetime.fromtimestamp(media_file.stat().st_mtime).isoformat()
                        })
                        posts_count += 1
                elif item.is_file() and item.suffix.lower() in ['.jpg', '.jpeg', '.png', '.mp4', '.mov']:
                    # Fichier directement dans posts
                    self.posts_data.append({
                        'filename': item.name,
                        'path': str(item),
                        'type': 'video' if item.suffix.lower() in ['.mp4', '.mov'] else 'photo',
                        'timestamp': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                    })
                    posts_count += 1
            
            if posts_count > 0:
                print(f"✅ Trouvé {posts_count} posts dans {posts_path}")
        
        # Parse stories
        stories_path = media_path / "stories"
        if stories_path.exists():
            stories_count = 0
            for item in stories_path.iterdir():
                if item.is_file() and item.suffix.lower() in ['.jpg', '.jpeg', '.png', '.mp4', '.mov']:
                    self.stories_data.append({
                        'filename': item.name,
                        'path': str(item),
                        'type': 'video' if item.suffix.lower() in ['.mp4', '.mov'] else 'photo',
                        'timestamp': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                    })
                    stories_count += 1
            
            if stories_count > 0:
                print(f"✅ Trouvé {stories_count} stories dans {stories_path}")
        
        # Parse autres dossiers médias (reels, other, etc.)
        other_path = media_path / "other"
        if other_path.exists():
            other_count = 0
            for item in other_path.iterdir():
                if item.is_file() and item.suffix.lower() in ['.jpg', '.jpeg', '.png', '.mp4', '.mov']:
                    self.posts_data.append({
                        'filename': item.name,
                        'path': str(item),
                        'type': 'video' if item.suffix.lower() in ['.mp4', '.mov'] else 'photo',
                        'category': 'other',
                        'timestamp': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                    })
                    other_count += 1
            
            if other_count > 0:
                print(f"✅ Trouvé {other_count} autres médias dans {other_path}")
        
        # Parse reels
        reels_path = media_path / "reels"
        if reels_path.exists():
            reels_count = 0
            for item in reels_path.iterdir():
                if item.is_file() and item.suffix.lower() in ['.jpg', '.jpeg', '.png', '.mp4', '.mov']:
                    self.posts_data.append({
                        'filename': item.name,
                        'path': str(item),
                        'type': 'video' if item.suffix.lower() in ['.mp4', '.mov'] else 'photo',
                        'category': 'reels',
                        'timestamp': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                    })
                    reels_count += 1
            
            if reels_count > 0:
                print(f"✅ Trouvé {reels_count} reels dans {reels_path}")
    
    def _parse_post_folder(self, post_folder: Path):
        """Parse un dossier de post"""
        # Chercher le fichier JSON ou HTML avec les métadonnées
        for file in post_folder.iterdir():
            if file.suffix in ['.json', '.html']:
                try:
                    if file.suffix == '.json':
                        with open(file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            self.posts_data.append(data)
                    else:
                        # Parse HTML si pas de JSON
                        with open(file, 'r', encoding='utf-8') as f:
                            soup = BeautifulSoup(f.read(), 'html.parser')
                            # Extraire les données du post depuis HTML
                            post_data = self._extract_post_from_html(soup, post_folder.name)
                            if post_data:
                                self.posts_data.append(post_data)
                except Exception as e:
                    print(f"Error parsing post {file}: {e}")
    
    def _extract_post_from_html(self, soup: BeautifulSoup, post_id: str) -> Optional[Dict]:
        """Extrait les données d'un post depuis HTML"""
        try:
            # Logique d'extraction basée sur la structure HTML observée
            return {
                'id': post_id,
                'caption': '',
                'timestamp': '',
                'media_type': 'photo'
            }
        except:
            return None
    
    def _parse_story_folder(self, story_folder: Path):
        """Parse un dossier de story"""
        # Similaire à parse_post_folder mais pour les stories
        pass
    
    def _parse_connections(self, connections_path: Path):
        """Parse les connexions (followers/following)"""
        
        # Parse followers
        followers_file = connections_path / "followers_1.html"
        if followers_file.exists():
            self.followers_data = self._parse_html_list(followers_file, "followers")
        
        # Parse following
        following_file = connections_path / "following.html"
        if following_file.exists():
            self.following_data = self._parse_html_list(following_file, "following")
    
    def _parse_html_list(self, file_path: Path, list_type: str) -> List[Dict]:
        """Parse une liste HTML (followers, following, etc.)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
            
            items = []
            
            # Méthode 1: Chercher les noms d'utilisateur dans les titres h2 (pour following)
            usernames_h2 = soup.find_all('h2', class_=lambda x: x and '_a6-h' in x and '_a6-i' in x)
            
            for username_elem in usernames_h2:
                username = username_elem.get_text(strip=True)
                if username:
                    # Chercher la date dans l'élément parent suivant
                    date_found = None
                    try:
                        parent_div = username_elem.find_parent('div')
                        if parent_div:
                            date_div = parent_div.find('div', class_='_a6-p')
                            if date_div:
                                # Chercher le dernier div qui contient la date
                                date_text = date_div.find_all('div')[-1].get_text(strip=True) if date_div.find_all('div') else None
                                if date_text and ('2025' in date_text or '2024' in date_text):
                                    date_found = date_text
                    except:
                        pass
                    
                    items.append({
                        'username': username,
                        'type': list_type,
                        'date_found': date_found or datetime.now().isoformat()
                    })
            
            # Méthode 2: Chercher directement dans les liens (pour followers)
            if not items:
                links = soup.find_all('a', href=lambda x: x and 'instagram.com' in x)
                
                for link in links:
                    href = link.get('href', '')
                    if 'instagram.com' in href:
                        # Extraire le nom d'utilisateur du lien
                        username = link.get_text(strip=True)
                        if username and not username.startswith('http'):
                            # Chercher la date dans le div parent
                            date_found = None
                            try:
                                parent_div = link.find_parent('div', class_='_a6-p')
                                if parent_div:
                                    date_divs = parent_div.find_all('div')
                                    if len(date_divs) > 1:
                                        date_text = date_divs[-1].get_text(strip=True)
                                        if '2025' in date_text or '2024' in date_text:
                                            date_found = date_text
                            except:
                                pass
                            
                            items.append({
                                'username': username,
                                'type': list_type,
                                'date_found': date_found or datetime.now().isoformat()
                            })
            
            print(f"✅ Trouvé {len(items)} {list_type}")
            return items
        except Exception as e:
            print(f"❌ Erreur parsing {file_path}: {e}")
            return []
    
    def _parse_profile_info(self, personal_info_path: Path):
        """Parse les informations de profil"""
        profile_file = personal_info_path / "personal_information" / "instagram_profile_information.html"
        if profile_file.exists():
            try:
                with open(profile_file, 'r', encoding='utf-8') as f:
                    soup = BeautifulSoup(f.read(), 'html.parser')
                
                # Extraire les informations du profil
                self.profile_data = self._extract_profile_info(soup)
            except Exception as e:
                print(f"Error parsing profile info: {e}")
    
    def _extract_profile_info(self, soup: BeautifulSoup) -> Dict:
        """Extrait les informations de profil depuis HTML"""
        profile_info = {}
        
        # Chercher les éléments d'information
        info_elements = soup.find_all('div', class_='_a6_r')
        for element in info_elements:
            text = element.get_text(strip=True)
            if text:
                # Essayer d'extraire des informations structurées
                if '@' in text:
                    profile_info['username'] = text
                elif 'followers' in text.lower():
                    profile_info['followers_count'] = self._extract_number(text)
                elif 'following' in text.lower():
                    profile_info['following_count'] = self._extract_number(text)
        
        return profile_info
    
    def _parse_likes(self, likes_path: Path):
        """Parse les likes"""
        liked_posts_file = likes_path / "liked_posts.html"
        if liked_posts_file.exists():
            self.likes_data = self._parse_html_list(liked_posts_file, "liked_posts")
    
    def _parse_comments(self, comments_path: Path):
        """Parse les commentaires"""
        comments_file = comments_path / "post_comments_1.html"
        if comments_file.exists():
            self.comments_data = self._parse_html_list(comments_file, "comments")
    
    def _parse_login_activity(self, login_path: Path):
        """Parse l'activité de connexion"""
        login_file = login_path / "login_activity.html"
        if login_file.exists():
            self.login_activity = self._parse_html_list(login_file, "login_activity")
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse une date depuis une chaîne"""
        if not date_str:
            return None
        
        try:
            # Formats de date couramment utilisés par Instagram
            formats = [
                "%b %d, %Y %I:%M %p",  # May 03, 2018 9:39 am
                "%B %d, %Y %I:%M %p",  # May 03, 2018 9:39 am
                "%Y-%m-%d %H:%M:%S",   # 2018-05-03 09:39:00
                "%d/%m/%Y %H:%M",      # 03/05/2018 09:39
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # Si aucun format ne fonctionne, essayer d'extraire au moins l'année
            year_match = re.search(r'(\d{4})', date_str)
            if year_match:
                return datetime(int(year_match.group(1)), 1, 1)
            
        except Exception as e:
            print(f"Error parsing date '{date_str}': {e}")
        
        return None
    
    def _extract_number(self, text: str) -> int:
        """Extrait un nombre d'une chaîne de texte"""
        numbers = re.findall(r'\d+', text)
        return int(numbers[0]) if numbers else 0
    
    def to_dataframes(self) -> Dict[str, pd.DataFrame]:
        """Convertit les données parsées en DataFrames pandas"""
        return {
            'messages': pd.DataFrame(self.messages_data),
            'posts': pd.DataFrame(self.posts_data),
            'followers': pd.DataFrame(self.followers_data),
            'following': pd.DataFrame(self.following_data),
            'stories': pd.DataFrame(self.stories_data),
            'likes': pd.DataFrame(self.likes_data),
            'comments': pd.DataFrame(self.comments_data),
            'login_activity': pd.DataFrame(self.login_activity),
            'ads_data': pd.DataFrame(self.ads_data),
            'search_history': pd.DataFrame(self.search_history)
        }
    
    def _parse_reels(self, reels_folder: Path):
        """Parse les données des Reels"""
        try:
            for reel_file in reels_folder.glob("*.json"):
                with open(reel_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    for item in data:
                        if isinstance(item, dict) and 'media' in item:
                            reel_data = {
                                'type': 'reel',
                                'timestamp': item.get('creation_timestamp', 0),
                                'caption': item.get('title', ''),
                                'uri': item.get('uri', ''),
                                'file': str(reel_file)
                            }
                            self.posts_data.append(reel_data)
        except Exception as e:
            print(f"Erreur parsing reels : {e}")
    
    def _parse_other_media(self, other_folder: Path):
        """Parse les autres médias"""
        try:
            for media_file in other_folder.glob("*.json"):
                with open(media_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    for item in data:
                        if isinstance(item, dict):
                            media_data = {
                                'type': 'other',
                                'timestamp': item.get('creation_timestamp', 0),
                                'caption': item.get('title', ''),
                                'uri': item.get('uri', ''),
                                'file': str(media_file)
                            }
                            self.posts_data.append(media_data)
        except Exception as e:
            print(f"Erreur parsing other media : {e}")
    
    def _parse_ads_data(self, ads_folder: Path):
        """Parse les données publicitaires"""
        try:
            ads_file = ads_folder / "ads_and_topics" / "ads_interests.json"
            if ads_file.exists():
                with open(ads_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    if 'inferred_data_primary_location' in data:
                        for topic in data['inferred_data_primary_location']:
                            ad_data = {
                                'type': 'interest',
                                'topic': topic,
                                'timestamp': datetime.now().timestamp()
                            }
                            self.ads_data.append(ad_data)
            
            # Parse advertiser interactions
            advertisers_file = ads_folder / "instagram_ads_and_businesses" / "advertisers_interacted_with.json"
            if advertisers_file.exists():
                with open(advertisers_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    for advertiser in data.get('ig_advertisers', []):
                        ad_data = {
                            'type': 'advertiser',
                            'name': advertiser.get('name', ''),
                            'timestamp': advertiser.get('timestamp', 0)
                        }
                        self.ads_data.append(ad_data)
                        
        except Exception as e:
            print(f"Erreur parsing ads data : {e}")
    
    def _parse_search_history(self, search_file: Path):
        """Parse l'historique de recherche"""
        try:
            with open(search_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                for search in data.get('searches_user', []):
                    search_data = {
                        'search_text': search.get('data', [{}])[0].get('search_text', ''),
                        'timestamp': search.get('timestamp', 0)
                    }
                    self.search_history.append(search_data)
                    
        except Exception as e:
            print(f"Erreur parsing search history : {e}")


def main():
    """Test du parser"""
    parser = InstagramDataParser("instagram_data")
    data = parser.parse_all_data()
    
    print("Données parsées :")
    for key, value in data.items():
        if isinstance(value, list):
            print(f"{key}: {len(value)} éléments")
        elif isinstance(value, dict):
            print(f"{key}: {len(value)} clés")
    
    # Convertir en DataFrames pour analyse
    dataframes = parser.to_dataframes()
    for name, df in dataframes.items():
        print(f"\n{name.upper()}: {len(df)} lignes")
        if len(df) > 0:
            print(df.head())


if __name__ == "__main__":
    main()