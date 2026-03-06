"use client";

import type { AudiencePersona } from "@/types/instagram";

const KEY = "insta_audience_personas";

export interface SavedPersonas {
  personas: AudiencePersona[];
  savedAt: string; // ISO date
}

export function loadPersonas(): SavedPersonas | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPersonas;
  } catch {
    return null;
  }
}

export function savePersonas(personas: AudiencePersona[]): void {
  if (typeof window === "undefined") return;
  const payload: SavedPersonas = { personas, savedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function clearPersonas(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
