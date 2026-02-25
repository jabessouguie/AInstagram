"use client";

import { useMemo } from "react";
import {
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Eye,
  BarChart2,
  Share2,
  Bookmark,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MetricCard, MetricCardSkeleton } from "@/components/dashboard/MetricCard";
import { FollowersChart } from "@/components/dashboard/FollowersChart";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { BestPostingTimes } from "@/components/creator/BestPostingTimes";
import { AudienceQuality } from "@/components/creator/AudienceQuality";
import { AudienceDemographics } from "@/components/creator/AudienceDemographics";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstagramData } from "@/hooks/useInstagramData";
import { formatNumber, formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  IMAGE: "📸 Photo",
  REEL: "🎬 Reel",
  STORY: "⏱️ Story",
  CAROUSEL: "🖼️ Carousel",
  VIDEO: "🎥 Vidéo",
};

export default function CreatorDashboard() {
  const { data, isLoading } = useInstagramData();

  const insightsRequest = useMemo(
    () => ({
      metrics: data?.metrics ?? {},
      profile: data?.profile ?? {},
      mode: "creator" as const,
    }),
    [data]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header profile={data?.profile} mode="creator" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Page title */}
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Créateur</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Chargement des données..."
                : data
                  ? `${formatNumber(data.metrics.engagementRate)}% taux d'engagement · Source: ${data.dataSource}`
                  : "Aucune donnée disponible"}
            </p>
          </div>
          {data && (
            <Badge variant="outline" className="self-start text-xs sm:self-auto">
              Mis à jour: {formatDate(new Date(data.parsedAt))}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
              ) : (
                <>
                  <MetricCard
                    title="Abonnés"
                    value={data?.profile.followerCount ?? 0}
                    change={data?.metrics.followerGrowthRate}
                    description="vs mois dernier"
                    icon={Users}
                    format="number"
                    iconColor="text-violet-400"
                    iconBg="bg-violet-500/10"
                  />
                  <MetricCard
                    title="Taux d'engagement"
                    value={data?.metrics.engagementRate ?? 0}
                    change={0.3}
                    description="vs mois dernier"
                    icon={TrendingUp}
                    format="percent"
                    iconColor="text-pink-400"
                    iconBg="bg-pink-500/10"
                  />
                  <MetricCard
                    title="Likes moyens/post"
                    value={Math.round(data?.metrics.avgLikesPerPost ?? 0)}
                    icon={Heart}
                    format="number"
                    iconColor="text-red-400"
                    iconBg="bg-red-500/10"
                  />
                  <MetricCard
                    title="Commentaires/post"
                    value={Math.round(data?.metrics.avgCommentsPerPost ?? 0)}
                    icon={MessageCircle}
                    format="number"
                    iconColor="text-amber-400"
                    iconBg="bg-amber-500/10"
                  />
                </>
              )}
            </div>

            {/* Followers chart */}
            <FollowersChart
              data={data?.metrics.followerGrowthByMonth ?? []}
              isLoading={isLoading}
            />

            {/* AI Insights */}
            <InsightsPanel request={insightsRequest} />
          </TabsContent>

          {/* ── Content Tab ── */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <EngagementChart
                data={data?.metrics.contentTypePerformance ?? []}
                isLoading={isLoading}
              />
              <BestPostingTimes
                days={data?.metrics.bestPostingDays ?? []}
                hours={data?.metrics.bestPostingHours ?? []}
                isLoading={isLoading}
              />
            </div>

            {/* Top posts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">10 derniers posts</CardTitle>
                <CardDescription>Posts les plus récents (hors stories)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {(data?.metrics.topPosts ?? []).map((post, i) => (
                      <div key={post.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-muted-foreground">
                            {post.caption || "Pas de légende"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatDate(new Date(post.timestamp))}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {TYPE_LABELS[post.mediaType] ?? post.mediaType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Audience Tab ── */}
          <TabsContent value="audience" className="space-y-6">
            {/* Reach KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
              ) : (
                <>
                  <MetricCard
                    title="Comptes touchés"
                    value={
                      data?.reachInsights?.accountsReached ??
                      Math.round(data?.metrics.avgReachPerPost ?? 0)
                    }
                    change={data?.reachInsights ? 173 : undefined}
                    description="vs période précédente"
                    icon={Eye}
                    format="number"
                    iconColor="text-cyan-400"
                    iconBg="bg-cyan-500/10"
                  />
                  <MetricCard
                    title="Impressions"
                    value={data?.reachInsights?.impressions ?? 0}
                    change={data?.reachInsights ? 182 : undefined}
                    description="vs période précédente"
                    icon={BarChart2}
                    format="number"
                    iconColor="text-violet-400"
                    iconBg="bg-violet-500/10"
                  />
                  <MetricCard
                    title="Visites du profil"
                    value={data?.reachInsights?.profileVisits ?? 0}
                    change={data?.reachInsights ? 19.6 : undefined}
                    description="vs période précédente"
                    icon={Users}
                    format="number"
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/10"
                  />
                  <MetricCard
                    title="Comptes interagis"
                    value={data?.contentInteractions?.accountsInteracted ?? 0}
                    change={data?.contentInteractions ? 179 : undefined}
                    description={`${data?.contentInteractions?.nonFollowerInteractionPct ?? 0}% non-abonnés`}
                    icon={Share2}
                    format="number"
                    iconColor="text-pink-400"
                    iconBg="bg-pink-500/10"
                  />
                </>
              )}
            </div>

            {/* Interaction breakdown by type */}
            {(data?.contentInteractions || isLoading) && (
              <div className="grid gap-4 sm:grid-cols-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)
                ) : (
                  <>
                    <MetricCard
                      title="Reels interactions"
                      value={data?.contentInteractions?.reels.interactions ?? 0}
                      change={398}
                      description="likes + comments + shares"
                      icon={TrendingUp}
                      format="number"
                      iconColor="text-orange-400"
                      iconBg="bg-orange-500/10"
                    />
                    <MetricCard
                      title="Saves (Reels)"
                      value={data?.contentInteractions?.reels.saves ?? 0}
                      icon={Bookmark}
                      format="number"
                      iconColor="text-amber-400"
                      iconBg="bg-amber-500/10"
                    />
                    <MetricCard
                      title="Non-abonnés touchés"
                      value={`${data?.reachInsights?.nonFollowerReachPct ?? 0}%`}
                      description="de la portée totale"
                      icon={MessageCircle}
                      format="raw"
                      iconColor="text-indigo-400"
                      iconBg="bg-indigo-500/10"
                    />
                  </>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <AudienceQuality
                followerCount={data?.profile.followerCount ?? 0}
                inactiveCount={data?.metrics.inactiveFollowersCount ?? 0}
                inactivePercentage={data?.metrics.inactiveFollowersPercentage ?? 0}
                nonReciprocalCount={data?.metrics.nonReciprocalFollowsCount ?? 0}
                followingCount={data?.profile.followingCount ?? 0}
                isLoading={isLoading}
              />

              <AudienceDemographics
                audienceInsights={data?.audienceInsights}
                isLoading={isLoading}
              />
            </div>

            <InsightsPanel request={{ ...insightsRequest, mode: "creator" }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
