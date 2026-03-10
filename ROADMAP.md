# InstaInsights — Roadmap Produit Stratégique

> **Document PM · Version 1.0 · Mars 2026**
> Méthodologie : RICE scoring · Horizon : 6 mois

---

## 1. Synthèse Exécutive

| Attribut | Détail |
|---|---|
| **Produit** | InstaInsights — plateforme d'analytics & outils de croissance Instagram |
| **Personas** | Créateurs de contenu · Influenceurs · Agences d'influence · Marques |
| **Problème résolu** | Manque d'insights actionnables sur les performances Instagram + friction dans la gestion des partenariats |
| **État actuel** | MVP fonctionnel avec 15+ modules : Dashboard, Media Kit, Collab Finder, Carousel AI, Reels AI, Calendar, Competitive, Audience Personas, Reports, etc. |
| **OKR principal** | Maximiser les utilisateurs récurrents (rétention hebdomadaire ≥ 40%) |

---

## 2. Audit Fonctionnel — État des Lieux

### ✅ Fonctionnalités déjà livrées (base solide)

| Module | Statut | Valeur core |
|---|---|---|
| Dashboard Creator (KPIs, contenu, audience) | ✅ Prod | Analytics de base |
| Agency Dashboard (portfolio, comparaison, IA) | ✅ Prod | Mode agence |
| Media Kit Generator (HTML/PDF, IA, thèmes) | ✅ Prod | Monétisation créateur |
| Collab Finder (15+ résultats, score pertinence, validation) | ✅ Prod | Développement business |
| Collab Tracker Board (kanban, suivi, relances) | ✅ Prod | CRM léger |
| Brand Pitch Express (email + media kit à la volée) | ✅ Prod | Gain de temps |
| Carousel Generator (IA + modes audience) | ✅ Prod | Production de contenu |
| Reels Ideas Generator (IA + tendances) | ✅ Prod | Production de contenu |
| Content Calendar (schedule, créneaux optimaux, iCal) | ✅ Prod | Organisation |
| Competitive Analysis (analyse par niche) | ✅ Prod | Benchmarking |
| Audience Personas (Big Five, brand voice) | ✅ Prod | Compréhension audience |
| Reports PDF (rapport mensuel) | ✅ Prod | Partage client |
| Connect (guide API Instagram Graph) | ⚠️ Partiel | Onboarding |
| Interactions (inactifs, DM suggestions, unfollow) | ✅ Prod | Community management |
| i18n FR/EN · Multi-AI (Gemini/Anthropic/OpenAI/Ollama) | ✅ Prod | Accessibilité |

### ⚠️ Gaps stratégiques identifiés

1. **Acquisition** : Pas de landing page, pas de modèle freemium → zéro funnel d'acquisition
2. **Rétention** : Pas d'historique d'évolution des abonnés dans le temps
3. **Monétisation** : Aucun plan payant → revenus = 0
4. **Onboarding** : Import ZIP complexe, pas de wizard guidé
5. **Mobile** : Expérience desktop uniquement
6. **Multi-compte** : Bloquant pour les agences sérieuses

---

## 3. Analyse de la Valeur & Scoring RICE

> **RICE = (Reach × Impact × Confidence) / Effort**
> - Reach : 1–10 (proportion d'utilisateurs concernés)
> - Impact : 0.25 / 0.5 / 1 / 2 / 3 (minimal → massif)
> - Confidence : % de certitude sur les estimations
> - Effort : sprints de 2 semaines (1 sprint = 2 semaines 1 dev)

| # | Fonctionnalité | Reach | Impact | Confidence | Effort | **RICE** | Priorité |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Plans tarifaires (Free/Pro/Agency)** | 10 | 3 | 80% | 3 | **8.0** | 🔴 Critique |
| 2 | **Onboarding wizard interactif** | 10 | 2 | 90% | 1.5 | **12.0** | 🔴 Critique |
| 3 | **Audience growth tracking (courbe abonnés)** | 10 | 2 | 95% | 1 | **19.0** | 🔴 Critique |
| 4 | **Instagram Graph API OAuth** (remplace ZIP) | 10 | 3 | 65% | 6 | **3.3** | 🟡 Important |
| 5 | **Invoice / Devis generator** | 8 | 2 | 85% | 2 | **6.8** | 🟠 Haute |
| 6 | **Hashtag performance tracker** | 9 | 2 | 85% | 2 | **7.7** | 🟠 Haute |
| 7 | **Alertes performance en temps réel** | 9 | 1 | 85% | 2 | **3.8** | 🟡 Important |
| 8 | **Campaign ROI tracker** (suivi rentabilité collab) | 7 | 2 | 75% | 3 | **3.5** | 🟡 Important |
| 9 | **Landing page + SEO** | 10 | 2 | 85% | 2 | **8.5** | 🔴 Critique |
| 10 | **Multi-compte** | 6 | 3 | 80% | 5 | **2.9** | 🟡 Important |
| 11 | **Story analytics approfondis** | 9 | 2 | 80% | 3 | **4.8** | 🟡 Important |
| 12 | **A/B Testing captions** | 8 | 2 | 75% | 3 | **4.0** | 🟡 Important |
| 13 | **Referral / Programme d'invitation** | 8 | 2 | 70% | 2 | **5.6** | 🟠 Haute |
| 14 | **Mobile PWA** | 9 | 1 | 75% | 5 | **1.4** | 🟢 Moyen |
| 15 | **Intégrations (Notion, Google Sheets)** | 6 | 1 | 80% | 2 | **2.4** | 🟢 Moyen |
| 16 | **Agency white-label** | 4 | 3 | 65% | 7 | **1.1** | 🟢 Moyen |
| 17 | **TikTok / YouTube analytics** | 7 | 2 | 55% | 8 | **1.0** | 🔵 Long terme |
| 18 | **Content library (save IA content)** | 7 | 1 | 80% | 2 | **2.8** | 🟢 Moyen |
| 19 | **Competitor tracking automatisé** | 7 | 1 | 70% | 4 | **1.2** | 🟢 Moyen |
| 20 | **Contrats collab numériques** | 5 | 2 | 60% | 6 | **1.0** | 🔵 Long terme |

---

## 4. Roadmap — Now / Next / Later

### 🎯 Principe de priorisation

Les fonctionnalités sont ordonnées par impact sur **la rétention récurrente** en premier, puis **la monétisation**, puis **la croissance**. Avec une équipe dev limitée (1–2 personnes), chaque sprint doit délivrer de la valeur visible.

---

### Phase 1 — NOW (M1–M2 · Avr–Mai 2026) : Fondations Rétention & Croissance

> **Objectif** : Transformer le MVP en produit "sticky" que les utilisateurs reviennent consulter chaque semaine.

| Sprint | Fonctionnalité | Livrable | RICE |
|---|---|---|:---:|
| S1 | **Audience growth tracking** | Graphe d'évolution abonnés/engagement sur 30/90/365 jours. Stockage des snapshots quotidiens dans localStorage + IndexedDB. Visualisation Recharts. | 19.0 |
| S1 | **Onboarding wizard** | Stepper 4 étapes : (1) Import données, (2) Profil créateur, (3) Objectifs, (4) First insight. Réduit le time-to-value de 80%. | 12.0 |
| S2 | **Landing page + SEO** | Page marketing `/` : headline, features, screenshots, CTA. Balises meta, sitemap, schema.org. Essentiel pour l'acquisition organique. | 8.5 |
| S2 | **Plans tarifaires (Free/Pro/Agency)** | Page pricing + gate des fonctionnalités avancées (Collab Finder illimité, Reports, White-label). Sans paiement en dur dans un premier temps (waitlist Pro). | 8.0 |

**Effort estimé** : 4 sprints × 1 dev = ~4 semaines

---

### Phase 2 — NEXT (M3–M4 · Juin–Juil 2026) : Monétisation & Valeur Pro

> **Objectif** : Activer le premier flux de revenus et fidéliser les utilisateurs Pro.

| Sprint | Fonctionnalité | Livrable | RICE |
|---|---|---|:---:|
| S3 | **Hashtag performance tracker** | Analyse des hashtags utilisés dans les posts : portée moyenne, taux d'engagement par hashtag, top/flop, suggestions IA. | 7.7 |
| S3 | **Invoice / Devis generator** | Génération de devis/factures PDF pour les collabs : nom de la marque, prestation, tarif, TVA. Basé sur `ratePerPost` du Media Kit. Sauvegarde en localStorage. | 6.8 |
| S4 | **Referral / Programme d'invitation** | Lien de parrainage unique, tracking des inscriptions, déblocage de 30 jours Pro gratuits par parrainage. | 5.6 |
| S4 | **Story analytics approfondis** | Taux de complétion, drop-off, interactions par slide, meilleur horaire stories. Parsing de `stories.html` de l'export. | 4.8 |

**Effort estimé** : 4 sprints × 1 dev = ~4 semaines

---

### Phase 3 — LATER (M5–M6 · Août–Sep 2026) : Scale & Différenciation

> **Objectif** : Adresser le segment Agences, améliorer la valeur Pro et préparer une levée / accélération.

| Sprint | Fonctionnalité | Livrable | RICE |
|---|---|---|:---:|
| S5 | **A/B Testing captions** | Proposer 2 variantes de caption IA pour un même post. Mesure des performances après publication (like/commentaires). Recommandation de la formule gagnante. | 4.0 |
| S5 | **Campaign ROI tracker** | Tableau de bord dédié aux collabs : revenus générés, engagements obtenus, coût par engagement, ROI en %. Lié au Collab Tracker. | 3.5 |
| S6 | **Multi-compte** | Sélecteur de compte en header. Données isolées par compte en localStorage. Indispensable pour les agences gérant 3+ créateurs. | 2.9 |
| S6 | **Instagram Graph API OAuth** | Authentification OAuth avec l'API officielle. Supprime la friction du ZIP. Migration progressive : l'import ZIP reste disponible en fallback. | 3.3 |

**Effort estimé** : 4 sprints × 1 dev = ~4 semaines

---

### 🔵 Backlog Long Terme (post M6)

| Fonctionnalité | Justification du report |
|---|---|
| Mobile PWA | Forte valeur mais effort élevé. Prioritiser desktop d'abord. |
| Agency White-label | Réservé à un palier tarifaire Enterprise, post-monétisation. |
| TikTok / YouTube analytics | Expansion plateforme — nécessite d'abord une base solide IG. |
| Contrats collab numériques | Complexité légale (signature, conformité). Partenariat tiers préférable. |
| Intégrations Notion / Google Sheets | Demande à valider par les utilisateurs via feedback. |

---

## 5. KPIs de Succès par Phase

### Phase 1 — NOW

| Fonctionnalité | KPI principal | Cible à 30 jours post-lancement |
|---|---|---|
| Audience growth tracking | % d'utilisateurs consultant le graphe chaque semaine | ≥ 55% des utilisateurs actifs |
| Onboarding wizard | Taux de complétion de l'onboarding | ≥ 65% des nouveaux inscrits |
| Landing page | Visiteurs organiques / semaine | ≥ 200 visites/semaine à J+30 |
| Plans tarifaires | Inscriptions waitlist Pro | ≥ 50 inscriptions waitlist en M2 |

### Phase 2 — NEXT

| Fonctionnalité | KPI principal | Cible à 30 jours post-lancement |
|---|---|---|
| Hashtag tracker | Nb d'analyses hashtag / utilisateur / mois | ≥ 3 analyses/mois |
| Invoice generator | Nb de devis générés | ≥ 2 devis/utilisateur actif |
| Referral | Nb d'invitations envoyées | ≥ 20% des utilisateurs Pro parrainent |
| Story analytics | Rétention des utilisateurs avec stories | +15% vs groupe sans stories |

### Phase 3 — LATER

| Fonctionnalité | KPI principal | Cible à 30 jours post-lancement |
|---|---|---|
| A/B Testing captions | Taux d'utilisation parmi les créateurs actifs | ≥ 30% des créateurs Pro |
| Campaign ROI tracker | Nb de collabs trackées avec ROI | ≥ 1,5 collab trackée/utilisateur Pro |
| Multi-compte | Nb moyen de comptes par utilisateur agence | ≥ 2,5 comptes/agence |
| Instagram API OAuth | Taux d'adoption vs import ZIP | ≥ 40% utilisent OAuth à M+2 |

---

## 6. Métriques de Rétention Globales (North Star)

| Métrique | Définition | Cible M6 |
|---|---|---|
| **WAU** (Weekly Active Users) | Utilisateurs ouvrant l'app ≥ 1× par semaine | ≥ 40% des inscrits |
| **Feature Breadth** | Nb moyen de modules utilisés par session | ≥ 3 modules / session |
| **Churn mensuel** | % d'utilisateurs inactifs depuis 30j | ≤ 15% |
| **Time-to-Value** | Délai entre inscription et 1er insight consulté | ≤ 5 minutes |
| **NPS** | Net Promoter Score (enquête mensuelle) | ≥ 35 |
| **MRR** (post plan payant) | Revenu mensuel récurrent | ≥ 500 € à M4 |

---

## 7. Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| API Instagram restreint l'accès OAuth | Moyen | Élevé | Garder l'import ZIP en parallèle. Documenter le processus de review. |
| Faible conversion Free → Pro | Moyen | Élevé | A/B tester le pricing. Commencer par une valeur Pro évidente (Reports illimités). |
| Données utilisateur perdues (localStorage) | Faible | Élevé | Ajouter export/import JSON des données. Prévoir backend (Supabase/PlanetScale) à M5. |
| Complexité croissante du codebase | Moyen | Moyen | Refactoring TS strict + tests Jest à chaque phase. CI/CD déjà en place. |
| Concurrence (Later Analytics, Iconosquare) | Élevé | Moyen | Différenciation : IA générative intégrée + outils collab = unique sur le marché. |

---

## 8. Stack Décisions Techniques associées

| Décision | Recommandation |
|---|---|
| **Persistance données** | Migrer de localStorage vers **Supabase** (PostgreSQL hosted) à M5 pour multi-compte et sync multi-device |
| **Authentification** | Intégrer **NextAuth.js** + Instagram OAuth avant lancement des plans payants |
| **Paiement** | **Stripe** avec Checkout Session + Webhooks (plans Pro/Agency) |
| **Analytics produit** | Intégrer **Posthog** (self-hosted ou cloud) pour tracker les feature usages et le funnel |
| **Emails** | **Resend** pour les rapports automatisés et les notifications |

---

*Roadmap générée le 10 mars 2026 · À réviser mensuellement en fonction des retours utilisateurs et des métriques observées.*
