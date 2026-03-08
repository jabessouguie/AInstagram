import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité d'InstaInsights — comment vos données Instagram sont utilisées et protégées.",
  robots: { index: true, follow: true },
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "InstaInsights";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://instainsights.app";
const CONTACT_EMAIL = "privacy@instainsights.app";
const LAST_UPDATED = "3 mars 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            {APP_NAME}
          </Link>
          <Link href="/" className="text-sm text-slate-400 transition-colors hover:text-white">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-white">Politique de confidentialité</h1>
          <p className="text-sm text-slate-400">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 leading-relaxed text-slate-300">
          <Section title="1. Introduction">
            <p>
              {APP_NAME} (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) exploite la
              plateforme d&apos;analyse Instagram accessible à l&apos;adresse{" "}
              <a href={APP_URL} className="text-violet-400 underline">
                {APP_URL}
              </a>{" "}
              (le &quot;Service&quot;). Cette Politique de confidentialité explique comment nous
              collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez
              notre Service.
            </p>
            <p className="mt-3">
              En utilisant {APP_NAME}, vous acceptez les pratiques décrites dans cette politique. Si
              vous n&apos;êtes pas d&apos;accord avec ses termes, veuillez cesser d&apos;utiliser le
              Service.
            </p>
          </Section>

          <Section title="2. Données collectées">
            <h3 className="mb-2 font-semibold text-white">
              2.1 Données Instagram via l&apos;API Graph
            </h3>
            <p>
              Lorsque vous connectez votre compte Instagram professionnel via Meta/Facebook Login,
              nous accédons uniquement aux données suivantes, avec votre consentement explicite :
            </p>
            <ul className="ml-4 mt-3 list-outside list-disc space-y-1.5 text-slate-400">
              <li>
                Informations de profil public (nom d&apos;utilisateur, bio, nombre d&apos;abonnés)
              </li>
              <li>
                Métriques de contenu (likes, commentaires, portée, impressions de vos propres posts)
              </li>
              <li>
                Insights d&apos;audience agrégés et anonymisés (données démographiques globales)
              </li>
              <li>Statistiques de Reels (temps de visionnage moyen, vues)</li>
              <li>Commentaires publics sur vos propres publications</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white">Nous n&apos;accédons jamais</strong> aux données de vos
              abonnés individuels, à leurs adresses e-mail, messages privés, ou à tout contenu
              d&apos;autres comptes sans autorisation explicite.
            </p>

            <h3 className="mb-2 mt-6 font-semibold text-white">2.2 Export Instagram</h3>
            <p>
              Si vous importez un fichier d&apos;export Instagram (format HTML/ZIP officiel), ces
              données sont traitées localement dans votre navigateur et sur notre serveur uniquement
              le temps de la session d&apos;analyse. Elles ne sont pas stockées de façon permanente.
            </p>

            <h3 className="mb-2 mt-6 font-semibold text-white">2.3 Données de navigation</h3>
            <p>
              Nous pouvons collecter des données techniques anonymisées : adresse IP, type de
              navigateur, pages visitées, à des fins de sécurité et d&apos;amélioration du Service.
            </p>
          </Section>

          <Section title="3. Utilisation des données">
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="ml-4 mt-3 list-outside list-disc space-y-1.5 text-slate-400">
              <li>
                Générer des analyses, tableaux de bord et recommandations IA personnalisées pour
                votre compte
              </li>
              <li>
                Alimenter les fonctionnalités de génération de contenu (captions, carousels, media
                kits) via des modèles d&apos;IA tiers (Google Gemini, Anthropic, OpenAI)
              </li>
              <li>Vous fournir des rapports et insights sur vos performances Instagram</li>
              <li>Améliorer et sécuriser notre Service</li>
            </ul>
            <p className="mt-4">
              <strong className="text-white">Nous ne vendons pas</strong> vos données à des tiers et
              ne les utilisons pas à des fins publicitaires.
            </p>
          </Section>

          <Section title="4. Partage avec des tiers">
            <p>
              Vos données peuvent être partagées avec les tiers suivants, dans les limites
              strictement nécessaires au fonctionnement du Service :
            </p>
            <div className="mt-4 space-y-4">
              <ThirdParty
                name="Meta / Instagram Graph API"
                purpose="Source de vos données Instagram. Gouverné par la Politique de données Meta."
                link="https://www.facebook.com/privacy/policy/"
              />
              <ThirdParty
                name="Google (Gemini AI)"
                purpose="Modèle d'IA pour la génération de contenu et d'insights. Les prompts contiennent des métriques agrégées, non des données personnelles identifiables."
                link="https://policies.google.com/privacy"
              />
              <ThirdParty
                name="Anthropic (Claude)"
                purpose="Modèle d'IA alternatif (si configuré). Mêmes garanties que Gemini."
                link="https://www.anthropic.com/privacy"
              />
              <ThirdParty
                name="OpenAI"
                purpose="Modèle d'IA alternatif (si configuré). Mêmes garanties que Gemini."
                link="https://openai.com/policies/privacy-policy"
              />
              <ThirdParty
                name="Vercel (hébergement)"
                purpose="Hébergeur de l'application. Données en transit chiffrées (HTTPS)."
                link="https://vercel.com/legal/privacy-policy"
              />
            </div>
          </Section>

          <Section title="5. Stockage et sécurité">
            <p>
              La majorité de vos préférences (couleurs de marque, polices, contexte de contenu IA)
              sont stockées localement dans votre navigateur via{" "}
              <code className="text-violet-400">localStorage</code> et ne transitent pas par nos
              serveurs.
            </p>
            <p className="mt-3">
              Vos tokens d&apos;accès Instagram sont transmis uniquement via HTTPS et ne sont jamais
              stockés de façon permanente côté serveur. Ils sont utilisés en mémoire le temps de la
              requête API.
            </p>
            <p className="mt-3">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
              conformes aux standards de l&apos;industrie pour protéger vos données.
            </p>
          </Section>

          <Section title="6. Permissions Instagram (Meta)">
            <p>
              {APP_NAME} utilise les permissions Instagram suivantes dans le cadre de l&apos;API
              Graph Meta :
            </p>
            <ul className="ml-4 mt-3 list-outside list-disc space-y-1.5 text-slate-400">
              <li>
                <code className="text-violet-400">instagram_basic</code> — accès au profil et aux
                médias de base
              </li>
              <li>
                <code className="text-violet-400">instagram_manage_insights</code> — accès aux
                métriques de performance (portée, impressions, temps de visionnage)
              </li>
              <li>
                <code className="text-violet-400">instagram_manage_comments</code> — lecture et
                réponse aux commentaires sur vos posts
              </li>
              <li>
                <code className="text-violet-400">pages_show_list</code> et{" "}
                <code className="text-violet-400">pages_read_engagement</code> — liaison avec la
                Page Facebook connectée
              </li>
            </ul>
            <p className="mt-4">
              Ces permissions sont demandées uniquement pour les fonctionnalités que vous utilisez
              activement. Vous pouvez révoquer ces permissions à tout moment depuis les{" "}
              <a
                href="https://www.facebook.com/settings?tab=applications"
                className="text-violet-400 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                paramètres de votre compte Facebook
              </a>
              .
            </p>
          </Section>

          <Section title="7. Vos droits (RGPD)">
            <p>
              Si vous résidez dans l&apos;Espace Économique Européen, vous disposez des droits
              suivants concernant vos données personnelles :
            </p>
            <ul className="ml-4 mt-3 list-outside list-disc space-y-1.5 text-slate-400">
              <li>
                <strong className="text-white">Droit d&apos;accès</strong> — obtenir une copie de
                vos données
              </li>
              <li>
                <strong className="text-white">Droit de rectification</strong> — corriger des
                données inexactes
              </li>
              <li>
                <strong className="text-white">Droit à l&apos;effacement</strong> — demander la
                suppression de vos données
              </li>
              <li>
                <strong className="text-white">Droit à la portabilité</strong> — recevoir vos
                données dans un format structuré
              </li>
              <li>
                <strong className="text-white">Droit d&apos;opposition</strong> — vous opposer à
                certains traitements
              </li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 underline">
                {CONTACT_EMAIL}
              </a>
              . Nous traiterons votre demande dans un délai de 30 jours.
            </p>
          </Section>

          <Section title="8. Suppression des données">
            <p>
              Conformément aux exigences de Meta pour les applications utilisant l&apos;API
              Instagram, vous pouvez demander la suppression de toutes les données que nous détenons
              vous concernant.
            </p>
            <p className="mt-3">
              Pour déclencher la suppression de vos données, utilisez l&apos;URL de callback de
              suppression fournie par Meta lors de la revue de notre application, ou contactez-nous
              directement à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p className="mt-3">
              Endpoint de suppression des données (Meta Data Deletion Callback) :{" "}
              <code className="rounded bg-slate-800 px-2 py-0.5 text-sm text-violet-400">
                {APP_URL}/api/auth/data-deletion
              </code>
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              {APP_NAME} utilise uniquement des cookies strictement nécessaires au fonctionnement du
              Service (session, sécurité CSRF). Nous n&apos;utilisons pas de cookies à des fins de
              ciblage publicitaire ou de tracking tiers.
            </p>
          </Section>

          <Section title="10. Modifications de cette politique">
            <p>
              Nous nous réservons le droit de mettre à jour cette politique. En cas de modification
              substantielle, nous vous informerons via une notification dans l&apos;application ou
              par e-mail. La date de &quot;Dernière mise à jour&quot; en haut de cette page
              reflètera toujours la version en vigueur.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>Pour toute question relative à cette politique de confidentialité :</p>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-700 bg-slate-900 p-6">
              <p>
                <span className="text-slate-500">Application :</span>{" "}
                <span className="font-medium text-white">{APP_NAME}</span>
              </p>
              <p>
                <span className="text-slate-500">Email :</span>{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <span className="text-slate-500">URL :</span>{" "}
                <a href={APP_URL} className="text-violet-400 underline">
                  {APP_URL}
                </a>
              </p>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} {APP_NAME} — Tous droits réservés
        </p>
        <p className="mt-2">
          <Link href="/" className="transition-colors hover:text-slate-300">
            Accueil
          </Link>
          {" · "}
          <Link href="/privacy" className="transition-colors hover:text-slate-300">
            Confidentialité
          </Link>
          {" · "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-slate-300">
            Contact
          </a>
        </p>
      </footer>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 border-b border-slate-800 pb-2 text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function ThirdParty({ name, purpose, link }: { name: string; purpose: string; link: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="mt-1 text-sm text-slate-400">{purpose}</p>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-violet-400 underline hover:text-violet-300"
        >
          Politique
        </a>
      </div>
    </div>
  );
}
