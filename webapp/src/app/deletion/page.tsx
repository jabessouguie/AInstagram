import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Suppression des données confirmée",
  description: "Votre demande de suppression de données a été prise en compte.",
  robots: { index: false, follow: false },
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "InstaInsights";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://instainsights.app";
const CONTACT_EMAIL = "privacy@instainsights.app";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function DeletionPage({ searchParams }: Props) {
  const { id } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-white">
            {APP_NAME}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
          </div>

          <div>
            <h1 className="mb-3 text-3xl font-bold text-white">Demande de suppression confirmée</h1>
            <p className="leading-relaxed text-slate-400">
              Nous avons bien reçu votre demande de suppression de données via Meta. Votre demande a
              été enregistrée et sera traitée dans les plus brefs délais.
            </p>
          </div>

          {id && (
            <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-6 text-left">
              <p className="text-sm font-medium text-slate-300">Détails de la demande</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Code de confirmation</span>
                <code className="rounded bg-violet-500/10 px-2 py-1 font-mono text-xs text-violet-400">
                  {id}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Statut</span>
                <span className="text-xs font-medium text-emerald-400">✓ Reçue</span>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-left">
            <p className="text-sm font-semibold text-slate-300">À propos de vos données</p>
            <p className="text-sm leading-relaxed text-slate-400">
              {APP_NAME} est une application{" "}
              <strong className="text-white">sans base de données persistante</strong>. Vos données
              Instagram ne sont jamais stockées sur nos serveurs — elles vivent uniquement dans
              votre navigateur (localStorage) et sont accessibles uniquement pendant votre session.
            </p>
            <p className="text-sm leading-relaxed text-slate-400">
              La révocation de l&apos;accès depuis vos{" "}
              <a
                href="https://www.facebook.com/settings?tab=applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 underline"
              >
                paramètres Facebook
              </a>{" "}
              suffit à couper tout accès de notre application à vos données Instagram.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-lg border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              Retour à l&apos;accueil
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Suppression de données — ${id ?? ""}`.trim()}
              className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Contacter le support
            </a>
          </div>

          <p className="text-xs text-slate-600">
            <Link href="/privacy" className="underline hover:text-slate-400">
              Politique de confidentialité
            </Link>
            {" · "}
            <a href={APP_URL} className="underline hover:text-slate-400">
              {APP_URL}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
