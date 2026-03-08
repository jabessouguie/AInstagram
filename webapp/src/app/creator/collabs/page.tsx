"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Mail,
  MessageCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInstagramData } from "@/hooks/useInstagramData";
import { useAnimatedStatus } from "@/hooks/useAnimatedStatus";
import { useT } from "@/lib/i18n";
import type { CollabMatch } from "@/app/api/collabs/route";
import { AIFeedbackBar } from "@/components/ui/ai-feedback-bar";

// ─── Type badge colors ─────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  brand: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  creator: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  event: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  media: "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" className="text-xs" onClick={copy}>
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié !" : label}
    </Button>
  );
}

// ─── DM Instagram panel ────────────────────────────────────────────────────────

function DMPanel({
  collab,
  profile,
}: {
  collab: CollabMatch;
  profile: { username?: string; followerCount?: number };
}) {
  const [dmText, setDmText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const genStatuses = ["Analyse du profil...", "Rédaction du message...", "Ajustement du ton..."];
  const genStatus = useAnimatedStatus(isGenerating, genStatuses);

  const generate = useCallback(
    async (feedback?: string) => {
      setIsGenerating(true);
      setShowPanel(true);
      try {
        const res = await fetch("/api/collabs/dm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collab, profile, feedback }),
        });
        const json = await res.json();
        if (json.success && json.data) setDmText(json.data.message as string);
      } finally {
        setIsGenerating(false);
      }
    },
    [collab, profile]
  );

  const igUrl = collab.instagramHandle
    ? `https://instagram.com/${collab.instagramHandle.replace("@", "")}`
    : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {collab.instagramHandle}
          </a>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => generate()}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <MessageCircle className="h-3 w-3 text-violet-400" />
          )}
          {isGenerating ? genStatus : dmText ? "Régénérer le DM" : "Générer un DM Instagram"}
        </Button>
        {dmText && (
          <button
            onClick={() => setShowPanel((p) => !p)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPanel ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {showPanel && dmText && (
        <div className="space-y-2.5 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
            <MessageCircle className="h-3 w-3" />
            Message Instagram Direct
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{dmText}</p>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={dmText} label="Copier le DM" />
            {igUrl && (
              <a href={igUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="text-xs text-violet-400">
                  <ExternalLink className="h-3 w-3" />
                  Ouvrir le profil
                </Button>
              </a>
            )}
          </div>
          <AIFeedbackBar
            onRegenerate={generate}
            isGenerating={isGenerating}
            placeholder="Trop formel ? Plus court ? Précise ton idée..."
          />
        </div>
      )}
    </div>
  );
}

// ─── Email panel ───────────────────────────────────────────────────────────────

function EmailPanel({
  collab,
  profile,
}: {
  collab: CollabMatch;
  profile: { username?: string; followerCount?: number };
}) {
  const t = useT();
  const [emailData, setEmailData] = useState<{ subject: string; body: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const genStatuses = [
    t("collabs.email.status.analyzeProfile"),
    t("collabs.email.status.draftSubject"),
    t("collabs.email.status.customizeContent"),
    t("collabs.email.status.addCTA"),
  ];
  const genStatus = useAnimatedStatus(isGenerating, genStatuses);

  const generate = useCallback(
    async (feedback?: string) => {
      setIsGenerating(true);
      setShowPanel(true);
      try {
        const res = await fetch("/api/collabs/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collab, profile, feedback }),
        });
        const json = await res.json();
        if (json.success && json.data) setEmailData(json.data as { subject: string; body: string });
      } finally {
        setIsGenerating(false);
      }
    },
    [collab, profile]
  );

  const fullEmailText = emailData ? `Objet : ${emailData.subject}\n\n${emailData.body}` : "";

  const mailtoUrl =
    collab.contactEmail && emailData
      ? `mailto:${collab.contactEmail}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
      : collab.contactEmail
        ? `mailto:${collab.contactEmail}`
        : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {collab.contactEmail && (
          <span className="font-mono text-xs text-muted-foreground">{collab.contactEmail}</span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => generate()}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Mail className="h-3 w-3 text-sky-400" />
          )}
          {isGenerating
            ? genStatus
            : emailData
              ? t("collabs.card.regenerateEmail")
              : t("collabs.card.generateEmail")}
        </Button>
        {emailData && (
          <button
            onClick={() => setShowPanel((p) => !p)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPanel ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {showPanel && emailData && (
        <div className="space-y-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
            <Mail className="h-3 w-3" />
            Email de collaboration
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("collabs.email.subject")}
            </div>
            <p className="text-sm font-semibold">{emailData.subject}</p>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("collabs.email.body")}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{emailData.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={fullEmailText} label="Copier l'email" />
            {mailtoUrl && (
              <a href={mailtoUrl}>
                <Button size="sm" variant="ghost" className="text-xs text-sky-400">
                  <ExternalLink className="h-3 w-3" />
                  Ouvrir dans Mail
                </Button>
              </a>
            )}
          </div>
          <AIFeedbackBar
            onRegenerate={generate}
            isGenerating={isGenerating}
            placeholder={t("collabs.email.feedbackPlaceholder")}
          />
        </div>
      )}
    </div>
  );
}

// ─── Collab Card ──────────────────────────────────────────────────────────────

function CollabCard({
  collab,
  profile,
}: {
  collab: CollabMatch;
  profile: { username?: string; followerCount?: number; bio?: string };
}) {
  const t = useT();

  const typeLabels: Record<string, string> = {
    brand: t("collabs.type.brand"),
    creator: t("collabs.type.creator"),
    event: t("collabs.type.event"),
    media: t("collabs.type.media"),
  };

  const typeColor = TYPE_COLORS[collab.type] ?? "";
  const typeLabel = typeLabels[collab.type] ?? collab.type;

  const hasDM = !!collab.instagramHandle;
  const hasEmail = !!collab.contactEmail;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
              {collab.name}
              <span
                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeColor}`}
              >
                {typeLabel}
              </span>
              {/* Channel badges */}
              {hasDM && (
                <span className="inline-flex items-center gap-1 rounded border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-400">
                  <MessageCircle className="h-2.5 w-2.5" />
                  DM
                </span>
              )}
              {hasEmail && (
                <span className="inline-flex items-center gap-1 rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-400">
                  <Mail className="h-2.5 w-2.5" />
                  Email
                </span>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              📍 {collab.location} · {collab.niche}
            </CardDescription>
          </div>
          {collab.potentialRevenue && (
            <Badge
              variant="outline"
              className="shrink-0 border-amber-400/30 text-xs text-amber-400"
            >
              💰 {collab.potentialRevenue}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-muted-foreground">{collab.reason}</p>

        {/* ── DM channel ── */}
        {hasDM && <DMPanel collab={collab} profile={profile} />}

        {/* Divider when both channels are available */}
        {hasDM && hasEmail && (
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        {/* ── Email channel ── */}
        {hasEmail && <EmailPanel collab={collab} profile={profile} />}

        {/* Fallback: no contact info */}
        {!hasDM && !hasEmail && collab.websiteHint && (
          <p className="text-xs text-muted-foreground">
            🔍 Recherche :{" "}
            <a
              href={`https://google.com/search?q=${encodeURIComponent(collab.websiteHint + " contact partenariat")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {collab.websiteHint}
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const INTEREST_SUGGESTIONS = [
  "Voyage",
  "Mode",
  "Food",
  "Tech",
  "Fitness",
  "Beauté",
  "Art",
  "Gaming",
  "Musique",
  "Business",
  "Développement personnel",
  "Photographie",
];

export default function CollabsPage() {
  const t = useT();
  const { data } = useInstagramData();
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [collabs, setCollabs] = useState<CollabMatch[]>([]);
  const [summary, setSummary] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const searchStatuses = [
    t("collabs.search.status.analyzeProfile"),
    t("collabs.search.status.searchPartners"),
    t("collabs.search.status.evaluateOpportunities"),
    t("collabs.search.status.selectMatches"),
    t("collabs.search.status.finalizeResults"),
  ];

  const searchStatus = useAnimatedStatus(isSearching, searchStatuses);

  const toggleInterest = (i: string) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const addCustomInterest = () => {
    if (!customInterest.trim() || interests.includes(customInterest.trim())) return;
    setInterests((prev) => [...prev, customInterest.trim()]);
    setCustomInterest("");
  };

  const search = useCallback(async () => {
    if (!location || !interests.length) return;
    setIsSearching(true);
    setError("");
    setCollabs([]);
    setSummary("");

    try {
      const res = await fetch("/api/collabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          interests,
          profile: data?.profile ?? {},
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCollabs((json.data.collabs as CollabMatch[]) ?? []);
        setSummary((json.data.summary as string) ?? "");
      } else {
        setError((json.error as string) ?? t("collabs.search.error"));
      }
    } catch {
      setError(t("collabs.search.networkError"));
    } finally {
      setIsSearching(false);
    }
  }, [location, interests, data, t]);

  return (
    <div className="min-h-screen bg-background">
      <Header profile={data?.profile} mode="creator" />

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-5 w-5 text-amber-400" />
            {t("collabs.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("collabs.subtitle")}</p>
        </div>

        {/* Search form */}
        <Card className="mb-8">
          <CardContent className="space-y-5 pt-6">
            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("collabs.location.label")}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("collabs.location.placeholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("collabs.interests.label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_SUGGESTIONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      interests.includes(i)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              {/* Custom interest */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
                  placeholder={t("collabs.interests.customPlaceholder")}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button size="sm" variant="outline" onClick={addCustomInterest}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {interests.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {i}
                      <button onClick={() => toggleInterest(i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={search}
              disabled={isSearching || !location || !interests.length}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {searchStatus}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {t("collabs.search.button")}
                </>
              )}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {summary && (
          <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-foreground/80">
            <span className="font-medium text-amber-400">{t("collabs.summary.prefix")}</span>
            {summary}
          </div>
        )}

        {collabs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {collabs.map((c) => (
              <CollabCard key={c.id} collab={c} profile={data?.profile ?? {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
