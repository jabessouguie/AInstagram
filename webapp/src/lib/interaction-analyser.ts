/**
 * Interaction Analysis Module
 * Analyses Instagram export data to identify:
 * - Followers who have never interacted with your posts
 * - Accounts to DM (you follow, they don't follow back, never interacted)
 * - Accounts to unfollow (you follow, they don't follow back, DM sent > 1 month ago)
 */

import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { InteractionAnalysis, UnfollowCandidate, InstagramFollower } from "@/types/instagram";

// ─── Path helpers ─────────────────────────────────────────────────────────────

function getDataRoot(): string {
  return process.env.INSTAGRAM_DATA_PATH ?? path.join(process.cwd(), "..", "data");
}

function findExportFolder(): string | null {
  const root = getDataRoot();
  if (!fs.existsSync(root)) return null;
  const entries = fs.readdirSync(root);
  const folder = entries.find((e) => {
    const full = path.join(root, e);
    return fs.statSync(full).isDirectory() && e.startsWith("instagram-");
  });
  return folder ? path.join(root, folder) : null;
}

function loadHtml(filePath: string): cheerio.CheerioAPI | null {
  if (!fs.existsSync(filePath)) return null;
  const html = fs.readFileSync(filePath, "utf-8");
  return cheerio.load(html);
}

// ─── Parse commenter usernames from export ────────────────────────────────────

function parseCommenters(exportFolder: string): Set<string> {
  const commenters = new Set<string>();

  // Instagram exports comments in your_instagram_activity/comments/
  const dirs = [
    path.join(exportFolder, "your_instagram_activity", "comments"),
    path.join(exportFolder, "your_instagram_activity", "media"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html") && f.includes("comment"));
    for (const file of files) {
      const $ = loadHtml(path.join(dir, file));
      if (!$) continue;
      // Comments often have the format: username: comment text
      $("div._a706, table tr td a").each((_: number, el: AnyNode) => {
        const text = $(el).text().trim();
        if (text && text.length > 1 && !text.includes(" ")) {
          commenters.add(text.toLowerCase());
        }
      });
    }
  }

  return commenters;
}

// ─── Parse liked usernames (from liked posts list in export) ──────────────────

function parseLikers(exportFolder: string): Set<string> {
  const likers = new Set<string>();
  const likesDir = path.join(exportFolder, "your_instagram_activity", "likes");
  if (!fs.existsSync(likesDir)) return likers;

  const files = fs.readdirSync(likesDir).filter((f) => f.endsWith(".html"));
  for (const file of files) {
    const $ = loadHtml(path.join(likesDir, file));
    if (!$) continue;
    $("a[href*='instagram.com']").each((_: number, el: AnyNode) => {
      const href = $(el).attr("href") ?? "";
      // Instagram exports use _u/ redirect URLs — try that pattern first
      const match =
        href.match(/instagram\.com\/_u\/([^/?#]+)/) ?? href.match(/instagram\.com\/([^/?#]+)/);
      if (match) likers.add(match[1].toLowerCase());
    });
  }

  return likers;
}

// ─── Parse sent DMs from export ───────────────────────────────────────────────

interface DMRecord {
  username: string;
  lastSentAt: Date;
}

function parseSentDMs(exportFolder: string): Map<string, DMRecord> {
  const dms = new Map<string, DMRecord>();
  const dmDirs = [
    path.join(exportFolder, "your_instagram_activity", "direct"),
    path.join(exportFolder, "your_instagram_activity", "messages"),
  ];

  for (const dmDir of dmDirs) {
    if (!fs.existsSync(dmDir)) continue;
    const files = fs.readdirSync(dmDir).filter((f) => f.endsWith(".html"));

    for (const file of files) {
      const $ = loadHtml(path.join(dmDir, file));
      if (!$) continue;

      // Try to find the username this thread belongs to
      const title = $("title").text().trim().toLowerCase().replace(/\s+/g, "_");
      if (!title || title.includes("group")) continue; // skip group chats

      // Find the most recent message sent by us (look for message blocks)
      let lastDate: Date | null = null;
      $("div._a706, table tr").each((_: number, el: AnyNode) => {
        const text = $(el).text().trim();
        // Look for ISO date patterns
        const dateMatch = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        if (dateMatch) {
          const d = new Date(dateMatch[0]);
          if (!lastDate || d > lastDate) lastDate = d;
        }
      });

      if (lastDate) {
        const username = title.split("_")[0];
        if (!dms.has(username)) {
          dms.set(username, { username, lastSentAt: lastDate });
        } else {
          const existing = dms.get(username)!;
          if (existing.lastSentAt.getTime() < (lastDate as Date).getTime()) {
            dms.set(username, { username, lastSentAt: lastDate });
          }
        }
      }
    }
  }

  return dms;
}

// ─── Parse followers / following from export ──────────────────────────────────

function parseFollowerFile(filePath: string): InstagramFollower[] {
  const $ = loadHtml(filePath);
  if (!$) return [];
  const result: InstagramFollower[] = [];
  $("a[href*='instagram.com']").each((_: number, el: AnyNode) => {
    // Some Instagram export versions put "_u/username" as the anchor text
    const username = $(el).text().trim().toLowerCase().replace(/^_u\//, "");
    const dateText = $(el).closest("li, tr").find("div[class*='_a72_']").text().trim();
    if (!username || username.length < 2) return;
    result.push({
      username,
      followedAt: dateText ? new Date(dateText) : new Date(0),
      isFollowingBack: false,
      isActive: false,
    });
  });
  return result;
}

// ─── Main analysis function ───────────────────────────────────────────────────

export async function analyseInteractions(): Promise<InteractionAnalysis | null> {
  const exportFolder = findExportFolder();
  if (!exportFolder) return null;

  const ffDir = path.join(exportFolder, "connections", "followers_and_following");
  if (!fs.existsSync(ffDir)) return null;

  // 1. Build follower/following sets
  const followerFiles = fs.readdirSync(ffDir).filter((f) => f.startsWith("followers"));
  const followerSet = new Set<string>();
  const followerDates = new Map<string, Date>();
  for (const file of followerFiles) {
    for (const f of parseFollowerFile(path.join(ffDir, file))) {
      followerSet.add(f.username);
      followerDates.set(f.username, f.followedAt);
    }
  }

  const followingSet = new Set<string>();
  const followingDates = new Map<string, Date>();
  for (const file of ["following.html"]) {
    const fp = path.join(ffDir, file);
    if (!fs.existsSync(fp)) continue;
    for (const f of parseFollowerFile(fp)) {
      followingSet.add(f.username);
      followingDates.set(f.username, f.followedAt);
    }
  }

  // 2. Who interacted (liked or commented) on our posts
  const commenters = parseCommenters(exportFolder);
  const likers = parseLikers(exportFolder);
  const interactors = new Set([...commenters, ...likers]);

  // 3. Sent DM history
  const sentDMs = parseSentDMs(exportFolder);

  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Category A: accounts you follow who have NEVER interacted with your posts
  const neverInteracted: UnfollowCandidate[] = [];
  // Category B: accounts you follow but they don't follow back → suggest DM (if never DM'd)
  const dmSuggestions: Array<{
    username: string;
    profileUrl: string;
    followedSince: Date;
    reason: string;
  }> = [];
  // Category C: they don't follow back + DM sent > 1 month ago → unfollow
  const unfollowCandidates: UnfollowCandidate[] = [];

  for (const username of followingSet) {
    const followedSince = followingDates.get(username) ?? new Date(0);
    const profileUrl = `https://www.instagram.com/${username}`;
    const theyFollowBack = followerSet.has(username);
    const neverInteractedWith = !interactors.has(username);

    // Category A: follows you back but never interacted
    if (theyFollowBack && neverInteractedWith) {
      neverInteracted.push({ username, followedSince, profileUrl });
    }

    // Category B + C: they don't follow back
    if (!theyFollowBack) {
      const dmRecord = sentDMs.get(username);
      if (dmRecord && now - dmRecord.lastSentAt.getTime() > ONE_MONTH_MS) {
        // DM was sent > 1 month ago, no follow-back → unfollow candidate
        unfollowCandidates.push({
          username,
          followedSince,
          profileUrl,
          lastDmSentAt: dmRecord.lastSentAt,
        });
      } else if (!dmRecord) {
        // Never DM'd → suggest reaching out
        dmSuggestions.push({
          username,
          profileUrl,
          followedSince,
          reason:
            followedSince.getTime() > 0
              ? `Tu suis @${username} depuis le ${followedSince.toLocaleDateString("fr-FR")} mais ils ne te suivent pas en retour`
              : `Tu suis @${username} mais ils ne te suivent pas en retour`,
        });
      }
    }
  }

  // Sort by most recently followed first
  const byFollowedDesc = (a: UnfollowCandidate, b: UnfollowCandidate) =>
    b.followedSince.getTime() - a.followedSince.getTime();

  return {
    neverInteracted: neverInteracted.sort(byFollowedDesc).slice(0, 200),
    dmSuggestions: dmSuggestions
      .sort((a, b) => b.followedSince.getTime() - a.followedSince.getTime())
      .slice(0, 50)
      .map((s) => ({ ...s, suggestedDm: "" })), // DMs generated on demand via Gemini
    unfollowCandidates: unfollowCandidates.sort(byFollowedDesc).slice(0, 100),
  };
}
