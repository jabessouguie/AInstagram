"use client";

/**
 * User Profile Store
 * Persists the creator's personal info (name, email, phone, photo) in localStorage.
 * Used by the media kit generator, collab email templates, and settings page.
 */

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Base64 data URL (data:image/...;base64,...) or empty string */
  profilePhotoBase64: string;
  savedAt: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  profilePhotoBase64: "",
  savedAt: new Date().toISOString(),
};

const KEY = "insta_user_profile";

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) } as UserProfile;
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify({ ...profile, savedAt: new Date().toISOString() }));
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/** Returns "Prénom Nom" or "" if both are empty */
export function getDisplayName(profile: UserProfile): string {
  const parts = [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean);
  return parts.join(" ");
}
