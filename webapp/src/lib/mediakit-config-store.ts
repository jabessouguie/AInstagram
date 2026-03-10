"use client";

/**
 * Media Kit Config Store
 * Persists the user's media kit customisations (partnerships, photo, email,
 * services, theme, tagline…) in localStorage so they survive page navigation.
 */

import { defaultMediaKitConfig, type MediaKitConfig } from "@/lib/mediakit-generator";

const KEY = "insta_mediakit_config";

export function loadMediaKitConfig(): Omit<MediaKitConfig, "lang"> {
  if (typeof window === "undefined") return defaultMediaKitConfig;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultMediaKitConfig;
    return { ...defaultMediaKitConfig, ...JSON.parse(raw) } as Omit<MediaKitConfig, "lang">;
  } catch {
    return defaultMediaKitConfig;
  }
}

export function saveMediaKitConfig(config: Omit<MediaKitConfig, "lang">): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(config));
}
