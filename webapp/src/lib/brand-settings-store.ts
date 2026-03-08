"use client";

/**
 * Brand Settings Store
 * Persists user's brand identity (fonts + colors) in localStorage.
 * Used by the carousel creator, media kit generator, and any AI prompt
 * that references design preferences.
 */

export interface BrandSettings {
  /** Title / heading font — Google Fonts name, e.g. "Playfair Display" */
  fontTitle: string;
  /** Subtitle / body font — Google Fonts name, e.g. "Montserrat" */
  fontSubtitle: string;
  /** Body / paragraph font — Google Fonts name, e.g. "Roboto" */
  fontBody: string;
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Secondary brand color (hex) */
  secondaryColor: string;
  /** Accent / highlight color (hex) */
  accentColor: string;
  /** Neutral / background color (hex) */
  neutralColor: string;
  /** Saved timestamp (ISO) */
  savedAt: string;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  fontTitle: "Playfair Display",
  fontSubtitle: "Montserrat",
  fontBody: "Roboto",
  primaryColor: "#1f3d3b",
  secondaryColor: "#495b29",
  accentColor: "#ffd953",
  neutralColor: "#cfcbba",
  savedAt: new Date().toISOString(),
};

const KEY = "insta_brand_settings";

export function loadBrandSettings(): BrandSettings {
  if (typeof window === "undefined") return DEFAULT_BRAND_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BRAND_SETTINGS;
    return { ...DEFAULT_BRAND_SETTINGS, ...JSON.parse(raw) } as BrandSettings;
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}

export function saveBrandSettings(settings: BrandSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify({ ...settings, savedAt: new Date().toISOString() }));
}

export function clearBrandSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
