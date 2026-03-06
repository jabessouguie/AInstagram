"use client";

import { useState } from "react";
import useSWR from "swr";
import { UserX, Trash2, Copy, Check, ExternalLink, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useInstagramData, getIgHeaders } from "@/hooks/useInstagramData";
import { useT } from "@/lib/i18n";
import type { InteractionAnalysis, UnfollowCandidate } from "@/types/instagram";

const fetcher = (url: string) => fetch(url, { headers: getIgHeaders() }).then((r) => r.json());

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="rounded p-1 text-muted-foreground hover:text-foreground">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function CandidateRow({ candidate, tag }: { candidate: UnfollowCandidate; tag?: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-3 border-b border-border/40 py-3 text-sm last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">@{candidate.username}</p>
        <p className="text-xs text-muted-foreground">
          {t("interactions.candidate.followedSince")}{" "}
          {candidate.followedSince && new Date(candidate.followedSince).getTime() > 0
            ? new Date(candidate.followedSince).toLocaleDateString("fr-FR")
            : t("interactions.candidate.unknownDate")}
          {candidate.lastDmSentAt && (
            <>
              {" "}
              · {t("interactions.candidate.lastDm")}{" "}
              {new Date(candidate.lastDmSentAt).toLocaleDateString("fr-FR")}
            </>
          )}
        </p>
      </div>
      {tag && (
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {tag}
        </Badge>
      )}
      <CopyButton text={`@${candidate.username}`} />
      <a
        href={candidate.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InteractionsPage() {
  const t = useT();
  const { data: instagramData } = useInstagramData();
  const { data, isLoading } = useSWR<{ success: boolean; data: InteractionAnalysis }>(
    "/api/interactions",
    fetcher,
    { revalidateOnFocus: false }
  );

  const analysis = data?.data;

  return (
    <div className="min-h-screen bg-background">
      <Header profile={instagramData?.profile} mode="creator" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-violet-400" />
            {t("interactions.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("interactions.subtitle")}</p>
        </div>

        {/* Summary badges */}
        {!isLoading && analysis && (
          <div className="mb-6 flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <UserX className="h-3.5 w-3.5 text-amber-400" />
              {analysis.neverInteracted.length} {t("interactions.badge.neverInteracted")}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              {analysis.unfollowCandidates.length} {t("interactions.badge.toUnfollow")}
            </Badge>
          </div>
        )}

        <Tabs defaultValue="inactive" className="space-y-6">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="inactive">{t("interactions.tabs.inactive")}</TabsTrigger>
            <TabsTrigger value="unfollow">{t("interactions.tabs.unfollow")}</TabsTrigger>
          </TabsList>

          {/* ── Inactive Tab ── */}
          <TabsContent value="inactive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <UserX className="h-4 w-4 text-amber-400" />
                  {t("interactions.inactive.title")}
                </CardTitle>
                <CardDescription>{t("interactions.inactive.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-7 w-16 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : analysis?.dataSource === "api" ? (
                  <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                    {t("interactions.api.inactive_unavailable")}
                  </p>
                ) : analysis?.neverInteracted.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t("interactions.inactive.empty")}
                  </p>
                ) : (
                  <div>
                    {analysis?.neverInteracted.map((c) => (
                      <CandidateRow key={c.username} candidate={c} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Unfollow Tab ── */}
          <TabsContent value="unfollow">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Trash2 className="h-4 w-4 text-red-400" />
                  {t("interactions.unfollow.title")}
                </CardTitle>
                <CardDescription>{t("interactions.unfollow.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : analysis?.dataSource === "api" ? (
                  <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
                    {t("interactions.api.unfollow_unavailable")}
                  </p>
                ) : analysis?.unfollowCandidates.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t("interactions.unfollow.empty")}
                  </p>
                ) : (
                  <div>
                    {analysis?.unfollowCandidates.map((c) => (
                      <CandidateRow
                        key={c.username}
                        candidate={c}
                        tag={t("interactions.candidate.unfollowTag")}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
