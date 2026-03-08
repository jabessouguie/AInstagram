import { NextResponse } from "next/server";
import { generateText, isAIConfigured, GEMINI_FLASH } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

interface DMSuggestRequest {
  username: string;
  bio?: string | null;
}

interface DMSuggestResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<DMSuggestResponse>> {
  try {
    const body: DMSuggestRequest = await request.json();
    const { username, bio } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: "Missing username" }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 501 }
      );
    }

    const prompt = bio?.trim()
      ? `I really like this instagram content creator and would love to connect and support.
Help me write a short, appropriate, human, natural, personal and catchy 1st instagram DM
expressing that idea. It must match the language of their bio.
Here is their bio: "${bio.trim()}"

Rules:
- Do NOT include characters like "—"
- Emojis and "." are ok
- Max 2 sentences
- Must feel genuine and personal
- Return ONLY the message text, no explanation, no quotes around it`
      : `I really like this instagram content creator @${username} and would love to connect and support.
Help me write a short, appropriate, human, natural, personal and catchy 1st instagram DM.

Rules:
- Do NOT include characters like "—"
- Emojis and "." are ok
- Max 2 sentences
- Must feel genuine and personal
- Address them as a fellow creator
- Return ONLY the message text, no explanation, no quotes around it`;

    const message = await generateText(prompt, { model: GEMINI_FLASH, maxTokens: 200 });
    return NextResponse.json({ success: true, message: message.trim() });
  } catch (error) {
    console.error("Error in /api/interactions/dm-suggest:", error);
    return NextResponse.json({ success: false, error: "Failed to generate DM" }, { status: 500 });
  }
}
