import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface BioResponse {
  bio: string | null;
  thumbnailUrl?: string | null;
}

/**
 * Attempt to fetch an Instagram profile's thumbnail via oEmbed.
 * Note: Instagram oEmbed does NOT return the bio text — it only returns
 * author_name and thumbnail_url. We return null for bio to let the
 * frontend fall back to manual input.
 */
export async function GET(request: Request): Promise<NextResponse<BioResponse>> {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const token = searchParams.get("token");

  if (!username) {
    return NextResponse.json({ bio: null }, { status: 400 });
  }

  // Instagram oEmbed: returns thumbnail_url + author_name (no bio)
  if (token && token !== "null") {
    try {
      const oembedUrl = new URL("https://graph.facebook.com/v22.0/instagram_oembed");
      oembedUrl.searchParams.set(
        "url",
        `https://www.instagram.com/${encodeURIComponent(username)}/`
      );
      oembedUrl.searchParams.set("access_token", token);

      const res = await fetch(oembedUrl.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = (await res.json()) as { thumbnail_url?: string };
        return NextResponse.json({ bio: null, thumbnailUrl: json.thumbnail_url ?? null });
      }
    } catch {
      // oEmbed failed or timed out
    }
  }

  // Bio is not available via public Instagram APIs without scraping
  // Return null — the frontend will show a manual input textarea
  return NextResponse.json({ bio: null });
}
