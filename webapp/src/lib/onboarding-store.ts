"use client";

/**
 * Onboarding store — persists the user's onboarding completion state and
 * profile answers in localStorage.
 */

const STORAGE_KEY = "insta_onboarding";

/** Creator goals collected during onboarding. */
export interface OnboardingProfile {
  niche: string;
  goal: string;
  targetFollowers: number;
  contentFocus: string;
  postsPerWeek: number;
}

/** Full onboarding state. */
export interface OnboardingState {
  completed: boolean;
  skippedAt?: string; // ISO date if skipped without completing
  profile?: OnboardingProfile;
}

const DEFAULT_STATE: OnboardingState = { completed: false };

/**
 * Loads the current onboarding state from localStorage.
 *
 * @returns Stored state, or default (not completed) if none exists.
 */
export function loadOnboarding(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Persists onboarding completion along with the creator profile answers.
 *
 * @param profile - Answers collected during the wizard.
 */
export function completeOnboarding(profile: OnboardingProfile): void {
  const state: OnboardingState = { completed: true, profile };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Marks the onboarding as skipped so it is not shown again.
 * The user can still restart it from Settings.
 */
export function skipOnboarding(): void {
  const state: OnboardingState = {
    completed: false,
    skippedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Resets the onboarding state so the wizard is shown again on next visit.
 * Useful for testing or re-configuration from Settings.
 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
