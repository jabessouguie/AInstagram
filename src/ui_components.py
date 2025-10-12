"""
Composants UI réutilisables pour Instagram Analytics
"""

import streamlit as st
from typing import Optional, Dict, Any, List
from src.design_system import COLORS, BORDERS, SPACING, SHADOWS


def metric_card(
    title: str,
    value: str,
    delta: Optional[str] = None,
    icon: Optional[str] = None,
    color: str = "primary"
) -> None:
    """
    Affiche une carte métrique stylisée
    
    Args:
        title: Titre de la métrique
        value: Valeur à afficher
        delta: Variation (optionnel)
        icon: Emoji icône (optionnel)
        color: Couleur du gradient (primary, success, warning, etc.)
    """
    icon_html = f'<span style="font-size: 2rem; margin-right: {SPACING["sm"]};">{icon}</span>' if icon else ''
    delta_html = f'<div style="color: {COLORS["success"]}; font-size: 0.875rem; margin-top: {SPACING["xs"]};">▲ {delta}</div>' if delta else ''
    
    st.markdown(f"""
    <div class="fade-in" style="
        background: {COLORS['gradient_instagram']};
        border-radius: {BORDERS['radius_xl']};
        padding: {SPACING['xl']};
        box-shadow: {SHADOWS['lg']};
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
    " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='{SHADOWS['xl']}'"
       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='{SHADOWS['lg']}'">
        {icon_html}
        <div style="color: white; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: {SPACING['sm']};">
            {title}
        </div>
        <div style="color: white; font-size: 2.5rem; font-weight: 700;">
            {value}
        </div>
        {delta_html}
    </div>
    """, unsafe_allow_html=True)


def info_box(message: str, box_type: str = "info") -> None:
    """
    Affiche une boîte d'information stylisée
    
    Args:
        message: Message à afficher
        box_type: Type de boîte (info, success, warning, danger)
    """
    colors_map = {
        'info': COLORS['info'],
        'success': COLORS['success'],
        'warning': COLORS['warning'],
        'danger': COLORS['danger'],
    }
    
    icons_map = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'danger': '❌',
    }
    
    color = colors_map.get(box_type, COLORS['info'])
    icon = icons_map.get(box_type, 'ℹ️')
    
    st.markdown(f"""
    <div class="slide-in" style="
        background: linear-gradient(135deg, {color}22 0%, {color}11 100%);
        border-left: 4px solid {color};
        border-radius: {BORDERS['radius_md']};
        padding: {SPACING['md']};
        margin: {SPACING['md']} 0;
        display: flex;
        align-items: center;
        gap: {SPACING['sm']};
    ">
        <span style="font-size: 1.5rem;">{icon}</span>
        <div style="flex: 1;">{message}</div>
    </div>
    """, unsafe_allow_html=True)


def section_header(title: str, subtitle: Optional[str] = None, icon: Optional[str] = None) -> None:
    """
    Affiche un header de section stylisé
    
    Args:
        title: Titre de la section
        subtitle: Sous-titre (optionnel)
        icon: Emoji icône (optionnel)
    """
    icon_html = f'<span style="margin-right: {SPACING["sm"]};">{icon}</span>' if icon else ''
    subtitle_html = f'<p style="color: {COLORS["text_secondary"]}; margin-top: {SPACING["sm"]}; font-size: 1rem;">{subtitle}</p>' if subtitle else ''
    
    st.markdown(f"""
    <div class="fade-in" style="
        margin: {SPACING['xl']} 0 {SPACING['lg']} 0;
        padding-bottom: {SPACING['md']};
        border-bottom: 2px solid {COLORS['border']};
    ">
        <h2 style="
            font-size: 2rem;
            font-weight: 700;
            background: {COLORS['gradient_instagram']};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0;
        ">
            {icon_html}{title}
        </h2>
        {subtitle_html}
    </div>
    """, unsafe_allow_html=True)


def stat_badge(label: str, value: str, color: str = "primary") -> None:
    """
    Affiche un badge statistique
    
    Args:
        label: Label du badge
        value: Valeur à afficher
        color: Couleur (primary, success, warning, etc.)
    """
    bg_color = COLORS.get(color, COLORS['primary'])
    
    st.markdown(f"""
    <div style="
        display: inline-block;
        background: {bg_color};
        color: white;
        padding: {SPACING['xs']} {SPACING['md']};
        border-radius: {BORDERS['radius_round']};
        font-size: 0.875rem;
        font-weight: 600;
        margin: {SPACING['xs']};
        box-shadow: {SHADOWS['sm']};
    ">
        {label}: <strong>{value}</strong>
    </div>
    """, unsafe_allow_html=True)


def progress_bar(progress: float, label: Optional[str] = None) -> None:
    """
    Affiche une barre de progression stylisée
    
    Args:
        progress: Valeur de 0 à 100
        label: Label de la progression (optionnel)
    """
    label_html = f'<div style="margin-bottom: {SPACING["xs"]}; color: {COLORS["text_secondary"]}; font-size: 0.875rem;">{label}</div>' if label else ''
    
    st.markdown(f"""
    <div class="fade-in">
        {label_html}
        <div style="
            background: {COLORS['background']};
            border-radius: {BORDERS['radius_round']};
            overflow: hidden;
            height: 12px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        ">
            <div style="
                width: {progress}%;
                height: 100%;
                background: {COLORS['gradient_instagram']};
                transition: width 0.5s ease;
                border-radius: {BORDERS['radius_round']};
            "></div>
        </div>
        <div style="text-align: right; margin-top: {SPACING['xs']}; color: {COLORS['text_secondary']}; font-size: 0.75rem;">
            {progress:.1f}%
        </div>
    </div>
    """, unsafe_allow_html=True)


def data_table(
    data: List[Dict[str, Any]],
    title: Optional[str] = None,
    searchable: bool = True
) -> None:
    """
    Affiche un tableau de données stylisé
    
    Args:
        data: Liste de dictionnaires représentant les données
        title: Titre du tableau (optionnel)
        searchable: Activer la recherche (optionnel)
    """
    if title:
        section_header(title, icon="📊")
    
    if searchable and len(data) > 10:
        search = st.text_input("🔍 Rechercher...", key=f"search_{title}")
        if search:
            data = [row for row in data if any(search.lower() in str(v).lower() for v in row.values())]
    
    st.dataframe(
        data,
        use_container_width=True,
        hide_index=True,
    )


def loading_spinner(message: str = "Chargement...") -> None:
    """
    Affiche un spinner de chargement personnalisé
    
    Args:
        message: Message de chargement
    """
    st.markdown(f"""
    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: {SPACING['xxl']};
        gap: {SPACING['md']};
    ">
        <div class="loading-spinner"></div>
        <div style="color: {COLORS['text_secondary']}; font-weight: 500;">
            {message}
        </div>
    </div>
    """, unsafe_allow_html=True)


def feature_card(
    title: str,
    description: str,
    icon: str,
    status: str = "active"
) -> None:
    """
    Affiche une carte de fonctionnalité
    
    Args:
        title: Titre de la fonctionnalité
        description: Description
        icon: Emoji icône
        status: Statut (active, beta, coming_soon)
    """
    status_colors = {
        'active': COLORS['success'],
        'beta': COLORS['warning'],
        'coming_soon': COLORS['info'],
    }
    
    status_labels = {
        'active': '✅ Actif',
        'beta': '🧪 Beta',
        'coming_soon': '🚀 Bientôt',
    }
    
    status_color = status_colors.get(status, COLORS['info'])
    status_label = status_labels.get(status, status)
    
    st.markdown(f"""
    <div class="fade-in" style="
        background: {COLORS['surface']};
        border-radius: {BORDERS['radius_lg']};
        padding: {SPACING['lg']};
        box-shadow: {SHADOWS['md']};
        transition: all 0.3s ease;
        height: 100%;
    " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='{SHADOWS['xl']}'"
       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='{SHADOWS['md']}'">
        <div style="font-size: 3rem; text-align: center; margin-bottom: {SPACING['md']};">
            {icon}
        </div>
        <h3 style="
            font-size: 1.25rem;
            font-weight: 700;
            color: {COLORS['text']};
            margin-bottom: {SPACING['sm']};
            text-align: center;
        ">
            {title}
        </h3>
        <p style="
            color: {COLORS['text_secondary']};
            font-size: 0.875rem;
            line-height: 1.5;
            text-align: center;
            margin-bottom: {SPACING['md']};
        ">
            {description}
        </p>
        <div style="
            text-align: center;
            padding: {SPACING['xs']} {SPACING['sm']};
            background: {status_color}22;
            color: {status_color};
            border-radius: {BORDERS['radius_md']};
            font-size: 0.75rem;
            font-weight: 600;
        ">
            {status_label}
        </div>
    </div>
    """, unsafe_allow_html=True)


def timeline_item(
    date: str,
    title: str,
    description: str,
    icon: str = "📅"
) -> None:
    """
    Affiche un élément de timeline
    
    Args:
        date: Date de l'événement
        title: Titre
        description: Description
        icon: Icône (optionnel)
    """
    st.markdown(f"""
    <div class="slide-in" style="
        display: flex;
        gap: {SPACING['md']};
        margin: {SPACING['md']} 0;
        padding-left: {SPACING['md']};
        border-left: 3px solid {COLORS['primary']};
    ">
        <div style="
            font-size: 2rem;
            flex-shrink: 0;
        ">
            {icon}
        </div>
        <div style="flex: 1;">
            <div style="
                color: {COLORS['primary']};
                font-size: 0.875rem;
                font-weight: 600;
                margin-bottom: {SPACING['xs']};
            ">
                {date}
            </div>
            <h4 style="
                font-size: 1.125rem;
                font-weight: 700;
                color: {COLORS['text']};
                margin: 0 0 {SPACING['xs']} 0;
            ">
                {title}
            </h4>
            <p style="
                color: {COLORS['text_secondary']};
                font-size: 0.875rem;
                margin: 0;
            ">
                {description}
            </p>
        </div>
    </div>
    """, unsafe_allow_html=True)
