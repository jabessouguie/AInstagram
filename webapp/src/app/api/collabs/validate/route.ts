import { NextResponse } from "next/server";
import { isValidEmail, isValidInstagramHandle } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export interface ValidateContactRequest {
  instagramHandle?: string;
  email?: string;
}

export interface ValidateContactResponse {
  success: boolean;
  emailValid: boolean | null;
  instagramValid: boolean | null;
}

/**
 * Checks whether an Instagram handle resolves to an existing public profile.
 * Only makes the request if the handle passes strict format validation first
 * (prevents SSRF by ensuring the URL stays within instagram.com).
 *
 * @param handle - Instagram handle with or without leading "@".
 * @returns True if the profile exists, false if not found, null on timeout/error.
 */
async function checkInstagram(handle: string): Promise<boolean | null> {
  const clean = handle.replace(/^@/, "").trim();

  // SSRF guard: reject handles that don't match the strict format
  if (!isValidInstagramHandle(clean)) return null;

  // Build a known-safe URL — clean is alphanumeric/dots/underscores only
  const url = `https://www.instagram.com/${clean}/`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status === 301 || res.status === 302;
  } catch {
    return null; // network error / timeout = unknown
  }
}

export async function POST(request: Request): Promise<NextResponse<ValidateContactResponse>> {
  try {
    const body: ValidateContactRequest = await request.json();
    const { instagramHandle, email } = body;

    // Use strict RFC-5322 subset regex from sanitize lib
    const emailValid = email ? isValidEmail(email) : null;
    const instagramValid = instagramHandle ? await checkInstagram(instagramHandle) : null;

    return NextResponse.json({ success: true, emailValid, instagramValid });
  } catch {
    return NextResponse.json(
      { success: false, emailValid: null, instagramValid: null },
      { status: 500 }
    );
  }
}
