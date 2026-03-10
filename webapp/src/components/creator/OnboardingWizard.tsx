"use client";

import { useState } from "react";
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles,
  Target,
  Users,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeOnboarding, skipOnboarding, type OnboardingProfile } from "@/lib/onboarding-store";

const NICHES = [
  "Mode & Beauté",
  "Voyage",
  "Food & Cuisine",
  "Fitness & Sport",
  "Lifestyle",
  "Tech & Gaming",
  "Art & Créatif",
  "Business",
  "Education",
  "Autre",
];

const GOALS = [
  {
    id: "growth",
    label: "Croissance rapide",
    desc: "Augmenter mon audience le plus vite possible",
  },
  {
    id: "monetization",
    label: "Monétisation",
    desc: "Générer des revenus via des collabs et partenariats",
  },
  { id: "community", label: "Communauté", desc: "Créer une audience engagée et fidèle" },
  {
    id: "brand",
    label: "Personal Branding",
    desc: "Construire mon identité et mon autorité dans ma niche",
  },
];

const CONTENT_TYPES = ["Posts", "Reels", "Stories", "Tout"];

/** Steps of the wizard (0-indexed). */
const STEPS = [
  { label: "Import", icon: Upload },
  { label: "Profil", icon: Users },
  { label: "Objectifs", icon: Target },
  { label: "Prêt", icon: Sparkles },
];

interface OnboardingWizardProps {
  /** Called after the user completes or skips the wizard. */
  onDone: () => void;
  /** Called when the user triggers a ZIP upload from within the wizard. */
  onUploadRequest: () => void;
  /** Whether a ZIP has been loaded (advances step 1 automatically). */
  hasData: boolean;
}

/**
 * Full-screen onboarding wizard shown to first-time users.
 * Collects creator profile information across 4 steps and saves it
 * to localStorage via the onboarding-store.
 */
export function OnboardingWizard({ onDone, onUploadRequest, hasData }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [targetFollowers, setTargetFollowers] = useState(10000);
  const [contentFocus, setContentFocus] = useState("Tout");
  const [postsPerWeek, setPostsPerWeek] = useState(3);

  const handleComplete = () => {
    const profile: OnboardingProfile = {
      niche,
      goal,
      targetFollowers,
      contentFocus,
      postsPerWeek,
    };
    completeOnboarding(profile);
    onDone();
  };

  const handleSkip = () => {
    skipOnboarding();
    onDone();
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute -top-10 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Passer
        </button>

        <Card className="border-primary/20 shadow-2xl">
          <CardContent className="p-6">
            {/* Step indicator */}
            <div className="mb-6 flex items-center justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isDone = i < step;
                const isActive = i === step;
                return (
                  <div key={s.label} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          isDone
                            ? "border-primary bg-primary text-primary-foreground"
                            : isActive
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`mx-2 mb-4 h-0.5 flex-1 transition-all ${i < step ? "bg-primary" : "bg-border"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step content */}
            <div className="min-h-[280px]">
              {/* ── Step 1: Import data ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">Bienvenue sur InstaInsights</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pour commencer, importez votre export Instagram. Cela permet d&apos;analyser
                      vos vrais chiffres.
                    </p>
                  </div>

                  <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
                    <p className="mb-2 font-medium">Comment obtenir votre export ?</p>
                    <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                      <li>Instagram → Paramètres → Confidentialité → Télécharger vos données</li>
                      <li>Choisir le format HTML</li>
                      <li>Attendre l&apos;email (max 48h)</li>
                    </ol>
                  </div>

                  {hasData ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                      <Check className="h-4 w-4" />
                      Données importées avec succès
                    </div>
                  ) : (
                    <Button className="w-full gap-2" onClick={onUploadRequest}>
                      <Upload className="h-4 w-4" />
                      Importer mon export ZIP
                    </Button>
                  )}

                  <p className="text-center text-xs text-muted-foreground">
                    Pas encore d&apos;export ?{" "}
                    <button className="underline hover:text-foreground" onClick={() => setStep(1)}>
                      Continuer avec les données de démo
                    </button>
                  </p>
                </div>
              )}

              {/* ── Step 2: Creator profile ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">Votre profil créateur</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quelques questions pour personnaliser vos recommandations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Votre niche principale</p>
                    <div className="flex flex-wrap gap-2">
                      {NICHES.map((n) => (
                        <button
                          key={n}
                          onClick={() => setNiche(n)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            niche === n
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Votre objectif principal</p>
                    <div className="grid gap-2">
                      {GOALS.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setGoal(g.id)}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            goal === g.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="text-sm font-medium">{g.label}</p>
                          <p className="text-xs text-muted-foreground">{g.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Goals ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">Vos objectifs</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fixez vos cibles — InstaInsights adaptera ses recommandations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Objectif d&apos;abonnés</p>
                      <span className="text-sm font-semibold text-primary">
                        {targetFollowers.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={1000000}
                      step={1000}
                      value={targetFollowers}
                      onChange={(e) => setTargetFollowers(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>1K</span>
                      <span>100K</span>
                      <span>1M</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Type de contenu principal</p>
                    <div className="flex gap-2">
                      {CONTENT_TYPES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setContentFocus(c)}
                          className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                            contentFocus === c
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Posts par semaine</p>
                      <span className="text-sm font-semibold text-primary">{postsPerWeek}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={14}
                      value={postsPerWeek}
                      onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>1/sem</span>
                      <span>7/sem</span>
                      <span>14/sem</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Ready ── */}
              {step === 3 && (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Vous êtes prêt !</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      InstaInsights est configuré selon votre profil.
                    </p>
                  </div>

                  <div className="w-full space-y-2 rounded-lg border border-border bg-card p-4 text-left text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">Ce qui vous attend :</span>
                    </div>
                    <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                      <li>Analyse complète de vos performances</li>
                      <li>Suivi de l&apos;évolution de vos abonnés</li>
                      <li>Insights IA personnalisés pour votre niche</li>
                      <li>Outils de collaboration et de création de contenu</li>
                    </ul>
                  </div>

                  <Button className="w-full gap-2" onClick={handleComplete}>
                    <Check className="h-4 w-4" />
                    Aller sur mon dashboard
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation */}
            {step < 3 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goPrev}
                  disabled={step === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>

                <Button
                  size="sm"
                  onClick={goNext}
                  disabled={step === 0 && !hasData && false}
                  className="gap-1"
                >
                  {step === 2 ? "Terminer" : "Suivant"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
