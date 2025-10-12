"""
Instagram Analytics - Design System
Palette de couleurs et thème visuel cohérent
"""

# Palette de couleurs principale - Instagram inspired
COLORS = {
    # Couleurs primaires
    'primary': '#E1306C',          # Rose Instagram
    'primary_light': '#F77737',    # Orange Instagram
    'primary_dark': '#C13584',     # Violet Instagram
    
    # Couleurs secondaires
    'secondary': '#405DE6',        # Bleu Instagram
    'secondary_light': '#5B51D8',  # Bleu-violet
    'secondary_dark': '#833AB4',   # Violet foncé
    
    # Couleurs d'accent
    'accent': '#FD1D1D',           # Rouge vif
    'accent_light': '#F77737',     # Orange
    'accent_dark': '#C13584',      # Magenta
    
    # Couleurs fonctionnelles
    'success': '#4CAF50',          # Vert succès
    'warning': '#FF9800',          # Orange warning
    'danger': '#F44336',           # Rouge erreur
    'info': '#2196F3',             # Bleu info
    
    # Neutrals
    'background': '#FAFAFA',       # Gris très clair
    'surface': '#FFFFFF',          # Blanc
    'text': '#262626',             # Noir Instagram
    'text_secondary': '#8E8E8E',   # Gris moyen
    'border': '#DBDBDB',           # Gris bordure
    
    # Gradients
    'gradient_instagram': 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    'gradient_blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'gradient_sunset': 'linear-gradient(135deg, #FE6B8B 30%, #FF8E53 90%)',
}

# Typographie
FONTS = {
    'primary': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'secondary': '"Roboto", sans-serif',
    'monospace': '"Fira Code", "Courier New", monospace',
}

# Espacements
SPACING = {
    'xs': '0.25rem',   # 4px
    'sm': '0.5rem',    # 8px
    'md': '1rem',      # 16px
    'lg': '1.5rem',    # 24px
    'xl': '2rem',      # 32px
    'xxl': '3rem',     # 48px
}

# Bordures
BORDERS = {
    'radius_sm': '4px',
    'radius_md': '8px',
    'radius_lg': '12px',
    'radius_xl': '16px',
    'radius_round': '50%',
}

# Ombres
SHADOWS = {
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
}

# Animations
ANIMATIONS = {
    'transition_fast': '0.15s ease',
    'transition_base': '0.3s ease',
    'transition_slow': '0.5s ease',
    'ease_in_out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}

# Composants spécifiques
COMPONENTS = {
    'card': {
        'background': COLORS['surface'],
        'border': f"1px solid {COLORS['border']}",
        'border_radius': BORDERS['radius_lg'],
        'shadow': SHADOWS['md'],
        'padding': SPACING['lg'],
    },
    'button_primary': {
        'background': COLORS['primary'],
        'color': COLORS['surface'],
        'border_radius': BORDERS['radius_md'],
        'padding': f"{SPACING['sm']} {SPACING['lg']}",
        'transition': ANIMATIONS['transition_base'],
    },
    'button_secondary': {
        'background': COLORS['surface'],
        'color': COLORS['primary'],
        'border': f"1px solid {COLORS['primary']}",
        'border_radius': BORDERS['radius_md'],
        'padding': f"{SPACING['sm']} {SPACING['lg']}",
        'transition': ANIMATIONS['transition_base'],
    },
    'metric_card': {
        'background': COLORS['gradient_instagram'],
        'color': COLORS['surface'],
        'border_radius': BORDERS['radius_xl'],
        'shadow': SHADOWS['lg'],
        'padding': SPACING['xl'],
    },
}

# Configuration Streamlit
STREAMLIT_CONFIG = {
    'primaryColor': COLORS['primary'],
    'backgroundColor': COLORS['background'],
    'secondaryBackgroundColor': COLORS['surface'],
    'textColor': COLORS['text'],
    'font': FONTS['primary'],
}

def get_custom_css() -> str:
    """Retourne le CSS personnalisé pour le thème"""
    return f"""
    <style>
        /* Import fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        /* Global styles */
        :root {{
            --primary: {COLORS['primary']};
            --primary-light: {COLORS['primary_light']};
            --primary-dark: {COLORS['primary_dark']};
            --secondary: {COLORS['secondary']};
            --success: {COLORS['success']};
            --warning: {COLORS['warning']};
            --danger: {COLORS['danger']};
            --info: {COLORS['info']};
            --text: {COLORS['text']};
            --text-secondary: {COLORS['text_secondary']};
            --background: {COLORS['background']};
            --surface: {COLORS['surface']};
            --border: {COLORS['border']};
        }}
        
        /* Main app */
        .main {{
            background: {COLORS['background']};
            font-family: {FONTS['primary']};
        }}
        
        /* Sidebar */
        [data-testid="stSidebar"] {{
            background: {COLORS['gradient_instagram']};
        }}
        
        [data-testid="stSidebar"] .stMarkdown {{
            color: {COLORS['surface']};
        }}
        
        /* Headers */
        h1, h2, h3 {{
            font-family: {FONTS['primary']};
            font-weight: 700;
            color: {COLORS['text']};
        }}
        
        h1 {{
            background: {COLORS['gradient_instagram']};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        /* Cards */
        .stCard {{
            background: {COLORS['surface']};
            border-radius: {BORDERS['radius_lg']};
            box-shadow: {SHADOWS['md']};
            padding: {SPACING['lg']};
            transition: all {ANIMATIONS['transition_base']};
        }}
        
        .stCard:hover {{
            box-shadow: {SHADOWS['xl']};
            transform: translateY(-2px);
        }}
        
        /* Metrics */
        [data-testid="stMetricValue"] {{
            font-size: 2rem;
            font-weight: 700;
            background: {COLORS['gradient_instagram']};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        [data-testid="stMetricLabel"] {{
            font-size: 0.875rem;
            font-weight: 600;
            color: {COLORS['text_secondary']};
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        /* Buttons */
        .stButton > button {{
            background: {COLORS['primary']};
            color: {COLORS['surface']};
            border: none;
            border-radius: {BORDERS['radius_md']};
            padding: {SPACING['sm']} {SPACING['lg']};
            font-weight: 600;
            transition: all {ANIMATIONS['transition_base']};
            cursor: pointer;
        }}
        
        .stButton > button:hover {{
            background: {COLORS['primary_dark']};
            box-shadow: {SHADOWS['lg']};
            transform: translateY(-2px);
        }}
        
        /* Dataframes */
        .stDataFrame {{
            border-radius: {BORDERS['radius_lg']};
            overflow: hidden;
            box-shadow: {SHADOWS['md']};
        }}
        
        /* Charts */
        .js-plotly-plot {{
            border-radius: {BORDERS['radius_lg']};
            overflow: hidden;
        }}
        
        /* Progress bars */
        .stProgress > div > div > div > div {{
            background: {COLORS['gradient_instagram']};
        }}
        
        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {{
            gap: {SPACING['sm']};
        }}
        
        .stTabs [data-baseweb="tab"] {{
            background: {COLORS['surface']};
            border-radius: {BORDERS['radius_md']};
            padding: {SPACING['sm']} {SPACING['lg']};
            font-weight: 600;
            transition: all {ANIMATIONS['transition_fast']};
        }}
        
        .stTabs [aria-selected="true"] {{
            background: {COLORS['gradient_instagram']};
            color: {COLORS['surface']};
        }}
        
        /* Inputs */
        .stTextInput > div > div > input,
        .stSelectbox > div > div > select {{
            border-radius: {BORDERS['radius_md']};
            border: 2px solid {COLORS['border']};
            transition: all {ANIMATIONS['transition_fast']};
        }}
        
        .stTextInput > div > div > input:focus,
        .stSelectbox > div > div > select:focus {{
            border-color: {COLORS['primary']};
            box-shadow: 0 0 0 3px rgba(225, 48, 108, 0.1);
        }}
        
        /* Expanders */
        .streamlit-expanderHeader {{
            background: {COLORS['surface']};
            border-radius: {BORDERS['radius_md']};
            font-weight: 600;
            transition: all {ANIMATIONS['transition_fast']};
        }}
        
        .streamlit-expanderHeader:hover {{
            background: {COLORS['background']};
        }}
        
        /* Alerts */
        .stAlert {{
            border-radius: {BORDERS['radius_md']};
            border-left: 4px solid {COLORS['primary']};
        }}
        
        /* Success boxes */
        .success-box {{
            background: linear-gradient(135deg, {COLORS['success']}22 0%, {COLORS['success']}11 100%);
            border-left: 4px solid {COLORS['success']};
            border-radius: {BORDERS['radius_md']};
            padding: {SPACING['md']};
            margin: {SPACING['md']} 0;
        }}
        
        /* Warning boxes */
        .warning-box {{
            background: linear-gradient(135deg, {COLORS['warning']}22 0%, {COLORS['warning']}11 100%);
            border-left: 4px solid {COLORS['warning']};
            border-radius: {BORDERS['radius_md']};
            padding: {SPACING['md']};
            margin: {SPACING['md']} 0;
        }}
        
        /* Info boxes */
        .info-box {{
            background: linear-gradient(135deg, {COLORS['info']}22 0%, {COLORS['info']}11 100%);
            border-left: 4px solid {COLORS['info']};
            border-radius: {BORDERS['radius_md']};
            padding: {SPACING['md']};
            margin: {SPACING['md']} 0;
        }}
        
        /* Animations */
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(10px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        
        @keyframes slideIn {{
            from {{ transform: translateX(-20px); opacity: 0; }}
            to {{ transform: translateX(0); opacity: 1; }}
        }}
        
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.7; }}
        }}
        
        .fade-in {{
            animation: fadeIn {ANIMATIONS['transition_base']} {ANIMATIONS['ease_in_out']};
        }}
        
        .slide-in {{
            animation: slideIn {ANIMATIONS['transition_base']} {ANIMATIONS['ease_in_out']};
        }}
        
        /* Loading spinner */
        .loading-spinner {{
            border: 3px solid {COLORS['border']};
            border-top: 3px solid {COLORS['primary']};
            border-radius: {BORDERS['radius_round']};
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }}
        
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        
        /* Gradient text */
        .gradient-text {{
            background: {COLORS['gradient_instagram']};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
        }}
        
        /* Footer */
        .footer {{
            background: {COLORS['surface']};
            border-top: 1px solid {COLORS['border']};
            padding: {SPACING['xl']};
            text-align: center;
            color: {COLORS['text_secondary']};
            margin-top: {SPACING['xxl']};
        }}
        
        /* Hide Streamlit branding */
        #MainMenu {{visibility: hidden;}}
        footer {{visibility: hidden;}}
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {{
            width: 10px;
        }}
        
        ::-webkit-scrollbar-track {{
            background: {COLORS['background']};
        }}
        
        ::-webkit-scrollbar-thumb {{
            background: {COLORS['gradient_instagram']};
            border-radius: {BORDERS['radius_md']};
        }}
        
        ::-webkit-scrollbar-thumb:hover {{
            background: {COLORS['primary_dark']};
        }}
    </style>
    """
