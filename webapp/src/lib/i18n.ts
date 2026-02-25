/**
 * Lightweight i18n — flat key/value dictionaries for FR and EN.
 * Usage: import { useT } from "@/lib/i18n";
 *        const t = useT();  →  t("dashboard.title")
 */

import { useLanguage } from "@/contexts/LanguageContext";

const FR = {
  // ── Header ────────────────────────────────────────────────────────────────
  "header.creator": "Créateur",
  "header.agency": "Agence",
  "header.followers": "abonnés",
  "header.portfolio": "Portfolio",
  "nav.dashboard": "Dashboard",
  "nav.interactions": "Interactions",
  "nav.mediakit": "Media Kit",
  "nav.collabs": "Collabs",
  "nav.responses": "Réponses",
  "nav.comments": "Commentaires",
  "nav.carousel": "Carrousel",

  // ── Dashboard ─────────────────────────────────────────────────────────────
  "dashboard.title": "Dashboard Créateur",
  "dashboard.loading": "Chargement des données...",
  "dashboard.noData": "Aucune donnée disponible",
  "dashboard.updatedAt": "Mis à jour",
  "dashboard.dataPeriod": "Période",
  "dashboard.source": "Source",

  // ── Tabs ──────────────────────────────────────────────────────────────────
  "tabs.overview": "Vue d'ensemble",
  "tabs.content": "Contenu",
  "tabs.audience": "Audience",

  // ── KPI cards ─────────────────────────────────────────────────────────────
  "kpi.followers": "Abonnés",
  "kpi.engagementRate": "Taux d'engagement",
  "kpi.avgLikes": "Likes moyens / post",
  "kpi.avgComments": "Commentaires moyens / post",
  "kpi.accountsReached": "Comptes touchés",
  "kpi.impressions": "Impressions",
  "kpi.profileVisits": "Visites du profil",
  "kpi.accountsInteracted": "Comptes ayant interagi",

  // ── Content tab ───────────────────────────────────────────────────────────
  "content.engagementByType": "Engagement par format",
  "content.engagementByTypeDesc": "Interactions moyennes selon le type de contenu publié",
  "content.bestTimes": "Meilleurs moments",
  "content.topPosts": "Publications récentes",
  "content.topPostsDesc": "Derniers posts hors stories, triés par date",
  "content.noCaption": "Sans légende",

  // ── Audience tab ──────────────────────────────────────────────────────────
  "audience.reach": "Portée & Impressions",
  "audience.reachDesc": "Données de la période d'insights",
  "audience.reelInteractions": "Interactions Reels",
  "audience.saves": "Enregistrements",
  "audience.nonFollowerReach": "Portée hors abonnés",
  "audience.quality": "Qualité de l'audience",
  "audience.demographics": "Démographie",

  // ── Common ────────────────────────────────────────────────────────────────
  "common.generate": "Générer",
  "common.refresh": "Actualiser",
  "common.loading": "Chargement...",
  "common.analyzing": "Analyse...",
  "common.download": "Télécharger",
  "common.copy": "Copier",
  "common.copied": "Copié !",
  "common.preview": "Aperçu",
  "common.back": "Retour",
  "common.next": "Suivant",
  "common.save": "Enregistrer",
} as const;

const EN: Record<keyof typeof FR, string> = {
  // ── Header ────────────────────────────────────────────────────────────────
  "header.creator": "Creator",
  "header.agency": "Agency",
  "header.followers": "followers",
  "header.portfolio": "Portfolio",
  "nav.dashboard": "Dashboard",
  "nav.interactions": "Interactions",
  "nav.mediakit": "Media Kit",
  "nav.collabs": "Collabs",
  "nav.responses": "Replies",
  "nav.comments": "Comments",
  "nav.carousel": "Carousel",

  // ── Dashboard ─────────────────────────────────────────────────────────────
  "dashboard.title": "Creator Dashboard",
  "dashboard.loading": "Loading data...",
  "dashboard.noData": "No data available",
  "dashboard.updatedAt": "Updated",
  "dashboard.dataPeriod": "Period",
  "dashboard.source": "Source",

  // ── Tabs ──────────────────────────────────────────────────────────────────
  "tabs.overview": "Overview",
  "tabs.content": "Content",
  "tabs.audience": "Audience",

  // ── KPI cards ─────────────────────────────────────────────────────────────
  "kpi.followers": "Followers",
  "kpi.engagementRate": "Engagement rate",
  "kpi.avgLikes": "Avg likes / post",
  "kpi.avgComments": "Avg comments / post",
  "kpi.accountsReached": "Accounts reached",
  "kpi.impressions": "Impressions",
  "kpi.profileVisits": "Profile visits",
  "kpi.accountsInteracted": "Accounts interacted",

  // ── Content tab ───────────────────────────────────────────────────────────
  "content.engagementByType": "Engagement by format",
  "content.engagementByTypeDesc": "Average interactions by content type published",
  "content.bestTimes": "Best times",
  "content.topPosts": "Recent posts",
  "content.topPostsDesc": "Latest non-story posts, sorted by date",
  "content.noCaption": "No caption",

  // ── Audience tab ──────────────────────────────────────────────────────────
  "audience.reach": "Reach & Impressions",
  "audience.reachDesc": "Data for the insights period",
  "audience.reelInteractions": "Reel interactions",
  "audience.saves": "Saves",
  "audience.nonFollowerReach": "Non-follower reach",
  "audience.quality": "Audience quality",
  "audience.demographics": "Demographics",

  // ── Common ────────────────────────────────────────────────────────────────
  "common.generate": "Generate",
  "common.refresh": "Refresh",
  "common.loading": "Loading...",
  "common.analyzing": "Analyzing...",
  "common.download": "Download",
  "common.copy": "Copy",
  "common.copied": "Copied!",
  "common.preview": "Preview",
  "common.back": "Back",
  "common.next": "Next",
  "common.save": "Save",
};

export type TranslationKey = keyof typeof FR;

/** Hook — returns a t() function scoped to the current language. */
export function useT() {
  const { lang } = useLanguage();
  const dict = lang === "en" ? EN : FR;
  return (key: TranslationKey) => dict[key] ?? key;
}
