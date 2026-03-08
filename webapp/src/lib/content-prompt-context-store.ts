"use client";

/**
 * Content Prompt Context Store
 * Persists AI-generated context that enriches future content creation prompts.
 * Populated from skip rate analysis, carousel analytics, story analytics, and
 * monthly reports. Applied automatically to reel caption, carousel, and story generation.
 */

export interface ReelsCaptionContext {
  savedAt: string;
  /** Themes and subjects that perform best (high watch time) */
  topThemes: string[];
  /** Angles and hooks that work well */
  bestAngles: string[];
  /** Patterns that cause skips — to avoid */
  skipPatterns: string[];
  /** Prompt fragment to prepend to reel caption generation */
  promptFragment: string;
}

export interface CarouselContext {
  savedAt: string;
  /** Slide types that get the most likes */
  topPerformingSlideTypes: string[];
  /** Content angles that drive saves and shares */
  topContentAngles: string[];
  /** Prompt fragment to prepend to carousel generation */
  promptFragment: string;
}

export interface StoriesContext {
  savedAt: string;
  /** Story types that drive the most replies/link taps */
  topStoryFormats: string[];
  /** Elements that drive the most engagement (stickers, polls, links) */
  bestEngagementDrivers: string[];
  /** Prompt fragment to prepend to stories generation */
  promptFragment: string;
}

export interface ContentPromptContext {
  reels?: ReelsCaptionContext;
  carousel?: CarouselContext;
  stories?: StoriesContext;
}

const KEY = "insta_content_prompt_context";

export function loadContentPromptContext(): ContentPromptContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ContentPromptContext;
  } catch {
    return {};
  }
}

export function saveReelsCaptionContext(ctx: Omit<ReelsCaptionContext, "savedAt">): void {
  if (typeof window === "undefined") return;
  const existing = loadContentPromptContext();
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...existing,
      reels: { ...ctx, savedAt: new Date().toISOString() },
    })
  );
}

export function saveCarouselContext(ctx: Omit<CarouselContext, "savedAt">): void {
  if (typeof window === "undefined") return;
  const existing = loadContentPromptContext();
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...existing,
      carousel: { ...ctx, savedAt: new Date().toISOString() },
    })
  );
}

export function saveStoriesContext(ctx: Omit<StoriesContext, "savedAt">): void {
  if (typeof window === "undefined") return;
  const existing = loadContentPromptContext();
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...existing,
      stories: { ...ctx, savedAt: new Date().toISOString() },
    })
  );
}

export function clearContentPromptContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
