"""
Parser multi-format pour Instagram Data
Support: JSON, HTML, Google Drive (via API)
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import streamlit as st
from bs4 import BeautifulSoup


class JSONFormatParser:
    """Parser pour les exports Instagram au format JSON"""
    
    @staticmethod
    def detect_json_format(data: Dict) -> str:
        """Détecte le type d'export JSON Instagram"""
        if 'followers' in data or 'following' in data:
            return 'connections'
        elif 'media' in data:
            return 'media'
        elif 'messages' in data or 'conversations' in data:
            return 'messages'
        elif 'liked_posts' in data:
            return 'likes'
        elif 'comments' in data:
            return 'comments'
        elif 'saved_posts' in data:
            return 'saved'
        elif 'stories' in data:
            return 'stories'
        return 'unknown'
    
    @staticmethod
    def parse_followers_json(file_path: Path) -> List[Dict]:
        """Parse followers.json"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            followers = []
            
            # Format 1: Liste directe
            if isinstance(data, list):
                for item in data:
                    if 'string_list_data' in item:
                        for entry in item['string_list_data']:
                            followers.append({
                                'username': entry.get('value', ''),
                                'timestamp': entry.get('timestamp', 0),
                                'href': entry.get('href', ''),
                            })
            
            # Format 2: Dictionnaire avec clé 'followers'
            elif isinstance(data, dict) and 'followers' in data:
                for item in data['followers']:
                    if 'string_list_data' in item:
                        for entry in item['string_list_data']:
                            followers.append({
                                'username': entry.get('value', ''),
                                'timestamp': entry.get('timestamp', 0),
                                'href': entry.get('href', ''),
                            })
            
            return followers
        except Exception as e:
            st.error(f"Erreur parsing JSON followers: {e}")
            return []
    
    @staticmethod
    def parse_following_json(file_path: Path) -> List[Dict]:
        """Parse following.json"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            following = []
            
            # Structures similaires à followers
            if isinstance(data, list):
                for item in data:
                    if 'string_list_data' in item:
                        for entry in item['string_list_data']:
                            following.append({
                                'username': entry.get('value', ''),
                                'timestamp': entry.get('timestamp', 0),
                                'href': entry.get('href', ''),
                            })
            
            elif isinstance(data, dict):
                # Chercher dans différentes clés possibles
                for key in ['following', 'relationships_following', 'following_list']:
                    if key in data:
                        items = data[key]
                        if isinstance(items, list):
                            for item in items:
                                if 'string_list_data' in item:
                                    for entry in item['string_list_data']:
                                        following.append({
                                            'username': entry.get('value', ''),
                                            'timestamp': entry.get('timestamp', 0),
                                            'href': entry.get('href', ''),
                                        })
            
            return following
        except Exception as e:
            st.error(f"Erreur parsing JSON following: {e}")
            return []
    
    @staticmethod
    def parse_media_json(file_path: Path) -> List[Dict]:
        """Parse media.json (posts, stories, etc.)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            media_items = []
            
            # Format liste directe
            if isinstance(data, list):
                for item in data:
                    media_items.append({
                        'caption': item.get('caption', item.get('title', '')),
                        'timestamp': item.get('creation_timestamp', item.get('taken_at', 0)),
                        'path': item.get('path', item.get('uri', '')),
                        'media_type': item.get('media_type', 'unknown'),
                    })
            
            # Format dictionnaire
            elif isinstance(data, dict):
                for key in ['media', 'photos', 'videos', 'posts', 'stories']:
                    if key in data:
                        items = data[key]
                        if isinstance(items, list):
                            for item in items:
                                media_items.append({
                                    'caption': item.get('caption', item.get('title', '')),
                                    'timestamp': item.get('creation_timestamp', item.get('taken_at', 0)),
                                    'path': item.get('path', item.get('uri', '')),
                                    'media_type': item.get('media_type', key),
                                })
            
            return media_items
        except Exception as e:
            st.error(f"Erreur parsing JSON media: {e}")
            return []
    
    @staticmethod
    def parse_messages_json(file_path: Path) -> Dict:
        """Parse messages.json"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            conversations = {}
            
            # Format avec clé 'messages' ou 'conversations'
            if isinstance(data, dict):
                for key in ['messages', 'conversations', 'inbox']:
                    if key in data:
                        items = data[key]
                        if isinstance(items, list):
                            for conv in items:
                                conv_name = conv.get('title', 'Unknown')
                                conversations[conv_name] = {
                                    'participants': conv.get('participants', []),
                                    'messages': conv.get('messages', []),
                                    'message_count': len(conv.get('messages', [])),
                                }
            
            return conversations
        except Exception as e:
            st.error(f"Erreur parsing JSON messages: {e}")
            return {}


class HTMLFormatParser:
    """Parser pour les exports Instagram au format HTML (existant amélioré)"""
    
    @staticmethod
    def parse_followers_html(file_path: Path) -> List[Dict]:
        """Parse followers depuis HTML"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            soup = BeautifulSoup(html_content, 'html.parser')
            followers = []
            
            # Chercher les liens vers les profils
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                if 'instagram.com' in href or href.startswith('https://www.instagram.com/'):
                    username = link.get_text(strip=True)
                    if username and username not in [f['username'] for f in followers]:
                        followers.append({
                            'username': username,
                            'href': href,
                            'timestamp': None,
                        })
            
            return followers
        except Exception as e:
            st.error(f"Erreur parsing HTML followers: {e}")
            return []


class GoogleDriveParser:
    """Parser pour Instagram Data stocké sur Google Drive"""
    
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path
        self.service = None
    
    def authenticate(self) -> bool:
        """Authentifie avec Google Drive API"""
        try:
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build
            
            SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
            
            # Utiliser les credentials sauvegardés ou créer de nouveaux
            creds = None
            token_path = Path('.cache/google_drive_token.json')
            
            if token_path.exists():
                creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
            
            if not creds or not creds.valid:
                if self.credentials_path and Path(self.credentials_path).exists():
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                    
                    # Sauvegarder les credentials
                    token_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(token_path, 'w') as token:
                        token.write(creds.to_json())
                else:
                    st.error("Fichier de credentials Google Drive introuvable")
                    return False
            
            self.service = build('drive', 'v3', credentials=creds)
            return True
        
        except ImportError:
            st.error("Installez google-auth-oauthlib et google-api-python-client")
            return False
        except Exception as e:
            st.error(f"Erreur authentification Google Drive: {e}")
            return False
    
    def list_files(self, folder_id: Optional[str] = None) -> List[Dict]:
        """Liste les fichiers Instagram Data sur Google Drive"""
        if not self.service:
            if not self.authenticate():
                return []
        
        try:
            query = "mimeType='application/zip' and trashed=false"
            if folder_id:
                query += f" and '{folder_id}' in parents"
            
            results = self.service.files().list(
                q=query,
                fields="files(id, name, size, createdTime)",
                orderBy="createdTime desc"
            ).execute()
            
            return results.get('files', [])
        
        except Exception as e:
            st.error(f"Erreur listage fichiers Google Drive: {e}")
            return []
    
    def download_file(self, file_id: str, destination: Path) -> bool:
        """Télécharge un fichier depuis Google Drive"""
        if not self.service:
            if not self.authenticate():
                return False
        
        try:
            from googleapiclient.http import MediaIoBaseDownload
            import io
            
            request = self.service.files().get_media(fileId=file_id)
            
            destination.parent.mkdir(parents=True, exist_ok=True)
            
            with open(destination, 'wb') as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                
                while not done:
                    status, done = downloader.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        st.progress(progress / 100, f"Téléchargement: {progress}%")
            
            return True
        
        except Exception as e:
            st.error(f"Erreur téléchargement Google Drive: {e}")
            return False


class MultiFormatParser:
    """Parser unifié pour tous les formats"""
    
    def __init__(self):
        self.json_parser = JSONFormatParser()
        self.html_parser = HTMLFormatParser()
        self.gdrive_parser = GoogleDriveParser()
    
    def detect_format(self, file_path: Path) -> str:
        """Détecte le format du fichier"""
        suffix = file_path.suffix.lower()
        
        if suffix == '.json':
            return 'json'
        elif suffix in ['.html', '.htm']:
            return 'html'
        elif suffix == '.zip':
            return 'archive'
        else:
            return 'unknown'
    
    def parse_file(self, file_path: Path, data_type: str) -> Any:
        """Parse un fichier selon son format et type"""
        format_type = self.detect_format(file_path)
        
        if format_type == 'json':
            if data_type == 'followers':
                return self.json_parser.parse_followers_json(file_path)
            elif data_type == 'following':
                return self.json_parser.parse_following_json(file_path)
            elif data_type == 'media':
                return self.json_parser.parse_media_json(file_path)
            elif data_type == 'messages':
                return self.json_parser.parse_messages_json(file_path)
        
        elif format_type == 'html':
            if data_type in ['followers', 'following']:
                return self.html_parser.parse_followers_html(file_path)
        
        return None
    
    def scan_directory(self, directory: Path) -> Dict[str, Any]:
        """Scanne un répertoire et parse tous les formats trouvés"""
        results = {
            'followers': [],
            'following': [],
            'media': [],
            'messages': {},
            'format_stats': {
                'json': 0,
                'html': 0,
                'other': 0,
            }
        }
        
        for file_path in directory.rglob('*'):
            if not file_path.is_file():
                continue
            
            format_type = self.detect_format(file_path)
            
            # Détecter le type de données par le nom du fichier
            file_name = file_path.stem.lower()
            
            if 'follower' in file_name and 'following' not in file_name:
                data = self.parse_file(file_path, 'followers')
                if data:
                    results['followers'].extend(data)
                    results['format_stats'][format_type] = results['format_stats'].get(format_type, 0) + 1
            
            elif 'following' in file_name:
                data = self.parse_file(file_path, 'following')
                if data:
                    results['following'].extend(data)
                    results['format_stats'][format_type] = results['format_stats'].get(format_type, 0) + 1
            
            elif any(word in file_name for word in ['media', 'post', 'photo', 'video']):
                data = self.parse_file(file_path, 'media')
                if data:
                    results['media'].extend(data)
                    results['format_stats'][format_type] = results['format_stats'].get(format_type, 0) + 1
            
            elif 'message' in file_name or 'conversation' in file_name:
                data = self.parse_file(file_path, 'messages')
                if data:
                    results['messages'].update(data)
                    results['format_stats'][format_type] = results['format_stats'].get(format_type, 0) + 1
        
        return results
