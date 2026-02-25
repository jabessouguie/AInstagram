import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DMSuggestRequest, DMSuggestResponse } from "@/types/instagram";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse<DMSuggestResponse>> {
  try {
    const body: DMSuggestRequest = await request.json();
    const { username, profileUrl, creatorProfile } = body;

    if (!username || !profileUrl) {
      return NextResponse.json(
        { success: false, error: "Missing username or profileUrl" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback DM if no Gemini key
      const fallbackDm = `Hey @${username}! I came across your profile and really loved your content — we seem to share the same vibe. Would love to follow and support each other! What kind of content are you working on lately? 🙌`;
      return NextResponse.json({ success: true, data: { suggestedDm: fallbackDm } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const prompt = `You are an Instagram content creator called @${creatorProfile.username ?? "me"} with ${creatorProfile.followerCount?.toLocaleString("en-US") ?? "several thousand"} followers.

You want to send a direct message (DM) to @${username} (profile: ${profileUrl}).
You follow this account but they don't follow you back yet.

Write a short, authentic, warm and personalised DM in English (2-3 sentences max). The DM must:
- Sound 100% human, not robotic
- Naturally suggest that you both follow and support each other (mutual follow / community support vibe)
- Feel genuine — reference their username (${username}) or their likely niche to make it personal
- Not be pushy or transactional
- End with an open question to start a conversation

Reply with ONLY the DM text, no quotes, no explanations.`;

    const result = await model.generateContent(prompt);
    const suggestedDm = result.response.text().trim();

    return NextResponse.json({ success: true, data: { suggestedDm } });
  } catch (error) {
    console.error("Error in /api/interactions/dm-suggest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate DM suggestion" },
      { status: 500 }
    );
  }
}
