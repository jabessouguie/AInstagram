"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Video,
  Loader2,
  AlertTriangle,
  TrendingDown,
  Zap,
  Lock,
  CheckCircle2,
  Lightbulb,
  Copy,
  Check,
  Users,
  Target,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstagramData } from "@/hooks/useInstagramData";
import type {
  InstagramPost,
  SkipRateInsights,
  SkipRateAnalysisResponse,
  ReelIdea,
  ReelIdeasResponse,
} from "@/types/instagram";
import { useT } from "@/lib/i18n";
import { saveReelsCaptionContext } from "@/lib/content-prompt-context-store";
import { computeOptimalSlots } from "@/lib/slot-analyzer";
import { OptimalSlotsWidget } from "@/components/creator/OptimalSlotsWidget";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function skipRisk(avgWatchTime: number | undefined, med: number): "low" | "medium" | "high" | null {
  if (!avgWatchTime || med === 0) return null;
  if (avgWatchTime < med * 0.6) return "high";
  if (avgWatchTime < med * 0.9) return "medium";
  return "low";
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({
  risk,
  t,
}: {
  risk: "low" | "medium" | "high" | null;
  t: ReturnType<typeof useT>;
}) {
  if (!risk) return <span className="text-xs text-muted-foreground">—</span>;
  const styles = {
    low: "bg-green-500/20 text-green-400",
    medium: "bg-amber-500/20 text-amber-400",
    high: "bg-red-500/20 text-red-400",
  };
  return (
    <Badge className={`border-0 text-xs ${styles[risk]}`}>
      {t(`skiprate.risk.${risk}` as Parameters<typeof t>[0])}
    </Badge>
  );
}

// ─── Reels Table ──────────────────────────────────────────────────────────────

function ReelsTable({
  reels,
  med,
  t,
}: {
  reels: InstagramPost[];
  med: number;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skiprate.col.caption")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skiprate.col.reach")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skiprate.col.views")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skiprate.col.watchtime")}
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skiprate.col.skiprisk")}
            </th>
          </tr>
        </thead>
        <tbody>
          {reels.map((r) => (
            <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
              <td className="max-w-xs px-4 py-3">
                <p className="truncate text-xs text-muted-foreground">
                  {r.caption.substring(0, 80) || "—"}
                </p>
              </td>
              <td className="px-4 py-3 text-right text-xs tabular-nums">
                {r.reach.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-xs tabular-nums">
                {r.videoViews != null ? r.videoViews.toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 text-right text-xs tabular-nums">
                {r.avgWatchTime != null ? `${r.avgWatchTime.toFixed(1)}s` : "—"}
              </td>
              <td className="px-4 py-3 text-center">
                <RiskBadge risk={skipRisk(r.avgWatchTime, med)} t={t} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────────────

function InsightsPanel({
  insights,
  t,
}: {
  insights: SkipRateInsights;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t("skiprate.insight.title")}</h2>
        <Badge className="ml-auto border-0 bg-muted/50 text-xs text-muted-foreground">
          médiane {insights.medianWatchTime.toFixed(1)}s
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Patterns */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-300">
            {t("skiprate.insight.patterns")}
          </p>
          <ul className="space-y-1.5">
            {insights.patterns.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {t("skiprate.insight.reco")}
          </p>
          <ul className="space-y-1.5">
            {insights.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReelsPage() {
  const t = useT();
  const { data } = useInstagramData();

  const [insights, setInsights] = useState<SkipRateInsights | null>(null);
  const [captionContext, setCaptionContext] = useState<
    SkipRateAnalysisResponse["captionContext"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextApplied, setContextApplied] = useState(false);

  const isApiConnected = typeof window !== "undefined" && !!localStorage.getItem("ig_access_token");

  const optimalSlots = useMemo(
    () => (data?.metrics ? computeOptimalSlots(data.metrics) : []),
    [data?.metrics]
  );

  // ── Reel ideas generator ──────────────────────────────────────────────────
  const [reelIdea, setReelIdea] = useState("");
  const [reelIdeas, setReelIdeas] = useState<ReelIdea[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerateIdeas = useCallback(async () => {
    if (!reelIdea.trim()) return;
    setIsGeneratingIdeas(true);
    setIdeasError("");
    setReelIdeas([]);
    setTrendingTopics([]);
    try {
      const res = await fetch("/api/reels/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: reelIdea,
          profile: {
            username: data?.profile?.username,
            followerCount: data?.profile?.followerCount,
            bio: data?.profile?.bio,
          },
          recentCaptions: data?.posts
            ?.filter((p) => p.mediaType === "REEL" && p.caption.trim().length > 0)
            .slice(0, 10)
            .map((p) => p.caption),
          audienceInsights: data?.audienceInsights
            ? {
                topCountries: data.audienceInsights.topCountries,
                ageGroups: data.audienceInsights.ageGroups,
                genderSplit: data.audienceInsights.genderSplit,
              }
            : undefined,
        }),
      });
      const json: ReelIdeasResponse = await res.json();
      if (json.success && json.ideas) {
        setReelIdeas(json.ideas);
        setTrendingTopics(json.trendingTopics ?? []);
      } else {
        setIdeasError(json.error ?? "Erreur lors de la génération");
      }
    } catch {
      setIdeasError("Erreur réseau");
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [reelIdea, data]);

  const copyCaption = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const reels = (data?.posts ?? [])
    .filter((p) => p.mediaType === "REEL")
    .sort((a, b) => {
      // Sort: high-risk first (lowest avgWatchTime), then nulls at end
      const aWt = a.avgWatchTime ?? Infinity;
      const bWt = b.avgWatchTime ?? Infinity;
      return aWt - bWt;
    });

  const reelsWithWatchTime = reels.filter((r) => r.avgWatchTime != null);
  const med = median(reelsWithWatchTime.map((r) => r.avgWatchTime!));
  const missingWatchTime = isApiConnected && reels.length > 0 && reelsWithWatchTime.length === 0;

  async function handleAnalyze() {
    if (!data || reels.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reels/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reels: reels.slice(0, 50), profile: data.profile }),
      });
      const json: SkipRateAnalysisResponse = await res.json();
      if (json.success && json.insights) {
        setInsights(json.insights);
        if (json.captionContext) setCaptionContext(json.captionContext);
      } else {
        setError(json.error ?? "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header mode="creator" />

      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8">
        {/* Title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <Video className="h-5 w-5 text-primary" />
              {t("skiprate.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("skiprate.subtitle")}</p>
          </div>

          {reels.length > 0 && (
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={loading || !data}
              className="shrink-0 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("skiprate.analyzing")}
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  {t("skiprate.analyze")}
                </>
              )}
            </Button>
          )}
        </div>

        {/* No API banner */}
        {!isApiConnected && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              {t("skiprate.no_api")}{" "}
              <a
                href="/creator/connect"
                className="font-medium underline underline-offset-2 hover:text-amber-200"
              >
                {t("nav.connect")} →
              </a>
            </span>
          </div>
        )}

        {/* Permission needed for watch-time metrics */}
        {missingWatchTime && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              La métrique <strong>Temps de visionnage moyen</strong> nécessite la permission{" "}
              <code className="rounded bg-amber-500/20 px-1 font-mono text-xs">
                instagram_manage_insights
              </code>{" "}
              sur votre token Instagram. Accordez cette permission dans le Meta Developer Portal
              puis reconnectez votre compte.
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* AI Insights */}
        {insights && <InsightsPanel insights={insights} t={t} />}

        {/* Apply context to caption generation prompt */}
        {captionContext && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Mettre à jour le prompt de génération de captions
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ces insights seront injectés automatiquement lors de vos prochaines générations de
                captions Reels.
              </p>
              {captionContext.topThemes.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <strong>Thèmes performants :</strong> {captionContext.topThemes.join(", ")}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => {
                saveReelsCaptionContext(captionContext);
                setContextApplied(true);
                setTimeout(() => setContextApplied(false), 3000);
              }}
              className="shrink-0 gap-1.5"
              variant={contextApplied ? "outline" : "default"}
            >
              {contextApplied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Appliqué
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Appliquer
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Optimal slots widget ── */}
        {optimalSlots.length > 0 && <OptimalSlotsWidget slots={optimalSlots} contentType="reel" />}

        {/* Reels Table */}
        {reels.length > 0 ? (
          <ReelsTable reels={reels} med={med} t={t} />
        ) : data ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Video className="mb-4 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("skiprate.no_reels")}</p>
          </div>
        ) : null}

        {/* ── Reel Ideas Generator ── */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold">Générateur d'idées de réels</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Soumets une idée de réel et l'IA génère des captions ciblant ton audience actuelle ET
            l'audience la plus réactive, en s'appuyant sur les tendances actuelles de ta niche.
          </p>

          <div className="flex gap-2">
            <textarea
              value={reelIdea}
              onChange={(e) => setReelIdea(e.target.value)}
              placeholder="Ex: Mes 3 astuces pour voyager léger en carry-on uniquement..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas || !reelIdea.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isGeneratingIdeas ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isGeneratingIdeas ? "Génération..." : "Générer"}
            </button>
          </div>

          {ideasError && <p className="text-xs text-red-400">{ideasError}</p>}

          {/* Trending topics */}
          {trendingTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tendances dans ta niche :
              </span>
              {trendingTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-400"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Ideas grouped by audience */}
          {reelIdeas.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Mon audience */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400">
                  <Users className="h-3.5 w-3.5" />
                  Mon audience
                </div>
                {reelIdeas
                  .filter((idea) => idea.targetMode === "my_audience")
                  .map((idea, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3"
                    >
                      <p className="text-[10px] font-medium italic text-violet-300">
                        🎬 Hook : {idea.hook}
                      </p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{idea.caption}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => copyCaption(idea.caption, idx)}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {copiedIdx === idx ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                          {copiedIdx === idx ? "Copié !" : "Copier"}
                        </button>
                        <span className="text-[10px] text-muted-foreground">
                          {idea.audienceDescription}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Audience optimisée */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Target className="h-3.5 w-3.5" />
                  Audience optimisée
                </div>
                {reelIdeas
                  .filter((idea) => idea.targetMode === "optimized")
                  .map((idea, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                    >
                      <p className="text-[10px] font-medium italic text-emerald-300">
                        🎬 Hook : {idea.hook}
                      </p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{idea.caption}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => copyCaption(idea.caption, 100 + idx)}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {copiedIdx === 100 + idx ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                          {copiedIdx === 100 + idx ? "Copié !" : "Copier"}
                        </button>
                        <span className="text-[10px] text-muted-foreground">
                          {idea.audienceDescription}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
