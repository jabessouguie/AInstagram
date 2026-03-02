"use client";

import { useState, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  MessageSquare,
  AtSign,
  Mail,
  Send,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstagramData, getIgHeaders } from "@/hooks/useInstagramData";
import { useT } from "@/lib/i18n";
import type { InboxComment, InboxData, InboxResponse } from "@/types/instagram";

const fetcher = (url: string) => fetch(url, { headers: getIgHeaders() }).then((r) => r.json());

// ─── Reply box ────────────────────────────────────────────────────────────────

function ReplyBox({
  commentId,
  mediaId,
  onSuccess,
}: {
  commentId?: string;
  mediaId?: string;
  onSuccess: () => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getIgHeaders() },
        body: JSON.stringify({ commentId, mediaId, message: text.trim() }),
      });
      const json: { success: boolean; error?: string } = await res.json();
      if (json.success) {
        setText("");
        onSuccess();
      } else {
        setError(json.error ?? t("inbox.error.send"));
      }
    } catch {
      setError(t("inbox.error.network"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={t("inbox.reply.placeholder")}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-8 gap-1.5 px-3"
        >
          {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Comment card ─────────────────────────────────────────────────────────────

function CommentCard({ comment, onRefresh }: { comment: InboxComment; onRefresh: () => void }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return `${Math.floor(diff / 60_000)}m`;
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Post reference */}
      <p className="mb-2 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
        {comment.mediaType} · {comment.mediaCaption.substring(0, 60) || "—"}
      </p>

      {/* Comment */}
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {comment.username.substring(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold">@{comment.username}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.timestamp)}</span>
            {comment.likeCount > 0 && (
              <span className="text-[10px] text-muted-foreground">♥ {comment.likeCount}</span>
            )}
          </div>
          <p className="mt-0.5 text-sm leading-relaxed">{comment.text}</p>
        </div>
      </div>

      {/* Replies toggle */}
      {comment.replies.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-10 mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {comment.replies.length} {t("inbox.replies")}
        </button>
      )}

      {expanded && (
        <div className="ml-10 mt-2 space-y-2 border-l border-border pl-3">
          {comment.replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                {r.username.substring(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold">@{r.username}</span>
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {timeAgo(r.timestamp)}
                </span>
                <p className="text-xs leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="ml-10 mt-3">
        <button
          onClick={() => setReplying(!replying)}
          className="text-xs text-primary hover:underline"
        >
          {replying ? t("inbox.reply.cancel") : t("inbox.reply.action")}
        </button>
      </div>

      {replying && (
        <div className="ml-10">
          <ReplyBox
            commentId={comment.id}
            onSuccess={() => {
              setReplying(false);
              onRefresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const t = useT();
  const { data: instagramData } = useInstagramData();
  const { mutate } = useSWRConfig();
  const [activeTab, setActiveTab] = useState<"comments" | "mentions" | "dms">("comments");

  const isApiConnected = typeof window !== "undefined" && !!localStorage.getItem("ig_access_token");

  const { data, isLoading } = useSWR<InboxResponse>("/api/inbox", fetcher, {
    revalidateOnFocus: false,
  });

  const inbox: InboxData | undefined = data?.data;
  const refresh = useCallback(() => mutate("/api/inbox"), [mutate]);

  const tabs: {
    id: "comments" | "mentions" | "dms";
    label: string;
    icon: typeof MessageSquare;
    count?: number;
  }[] = [
    {
      id: "comments",
      label: t("inbox.tabs.comments"),
      icon: MessageSquare,
      count: inbox?.comments.length,
    },
    { id: "mentions", label: t("inbox.tabs.mentions"), icon: AtSign },
    { id: "dms", label: t("inbox.tabs.dms"), icon: Mail },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header profile={instagramData?.profile} mode="creator" />

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t("inbox.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("inbox.subtitle")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} title={t("inbox.refresh")}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* No API banner */}
        {!isApiConnected && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <Link2 className="h-4 w-4 shrink-0" />
            <span>
              {t("inbox.no_api")}{" "}
              <a
                href="/creator/connect"
                className="font-medium underline underline-offset-2 hover:text-amber-200"
              >
                {t("nav.connect")} →
              </a>
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px]">{tab.count}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Comments tab */}
        {activeTab === "comments" && (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            ) : inbox?.dataSource === "unavailable" ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t("inbox.no_api")}</p>
              </div>
            ) : inbox?.comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t("inbox.comments.empty")}</p>
              </div>
            ) : (
              inbox?.comments.map((c) => <CommentCard key={c.id} comment={c} onRefresh={refresh} />)
            )}
          </div>
        )}

        {/* Mentions tab */}
        {activeTab === "mentions" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <AtSign className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium">{t("inbox.mentions.soon")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("inbox.mentions.desc")}</p>
          </div>
        )}

        {/* DMs tab */}
        {activeTab === "dms" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Mail className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium">{t("inbox.dms.soon")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("inbox.dms.desc")}</p>
            <a
              href="https://www.instagram.com/direct/inbox/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs font-medium text-primary underline underline-offset-2"
            >
              {t("inbox.dms.open")} →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
