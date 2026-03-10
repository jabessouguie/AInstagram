import { NextResponse } from "next/server";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function checkInstagram(handle: string): Promise<boolean | null> {
  const clean = handle.replace(/^@/, "").trim();
  if (!clean) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(clean)}/`, {
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

    const emailValid = email ? EMAIL_REGEX.test(email.trim()) : null;
    const instagramValid = instagramHandle ? await checkInstagram(instagramHandle) : null;

    return NextResponse.json({ success: true, emailValid, instagramValid });
  } catch {
    return NextResponse.json(
      { success: false, emailValid: null, instagramValid: null },
      { status: 500 }
    );
  }
}
