import { NextResponse } from "next/server";
import {
  generateText,
  isAIConfigured,
  stripJsonFences,
  getActiveProvider,
} from "@/lib/ai-provider";
import { sanitizePromptInput, wrapUserInput } from "@/lib/sanitize";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limiter";
import type { ReelIdeasRequest, ReelIdeasResponse, ReelIdea } from "@/types/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function generateWithGeminiGrounding(prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(key);
  // Use google search grounding for trend discovery
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // @ts-expect-error — googleSearch tool type may not be exported in older SDK versions
      tools: [{ googleSearch: {} }],
    });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    // Fallback: generate without grounding
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }
}

/** 5 reel idea generations per 2 minutes per IP. */
const RATE_LIMIT = { max: 5, windowMs: 2 * 60 * 1000 };

export async function POST(request: Request): Promise<NextResponse<ReelIdeasResponse>> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rlKey = `reels-ideas:${ip}`;
  const headers = rateLimitHeaders(rlKey, RATE_LIMIT.max, RATE_LIMIT.windowMs);

  if (!checkRateLimit(rlKey, RATE_LIMIT.max, RATE_LIMIT.windowMs)) {
    return NextResponse.json(
      { success: false, error: "Too many requests — please wait before generating again" },
      { status: 429, headers }
    );
  }

  try {
    const body: ReelIdeasRequest = await request.json();
    const { idea, profile, recentCaptions = [], audienceInsights } = body;

    if (!idea?.trim()) {
      return NextResponse.json({ success: false, error: "Idea is required" }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 501 }
      );
    }

    // Audience context
    const topCountry = audienceInsights?.topCountries
      ? (Object.entries(audienceInsights.topCountries).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "France")
      : "France";

    const topAge = audienceInsights?.ageGroups
      ? (Object.entries(audienceInsights.ageGroups).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "25-34")
      : "25-34";

    const topGender =
      (audienceInsights?.genderSplit?.female ?? 50) >= (audienceInsights?.genderSplit?.male ?? 50)
        ? "femmes"
        : "hommes";

    const captionsSample = recentCaptions
      .slice(0, 8)
      .map((c, i) => `${i + 1}. "${c.substring(0, 150)}"`)
      .join("\n");

    const safeIdea = wrapUserInput(idea, "reel_idea", 400);
    const safeBio = sanitizePromptInput(profile.bio ?? "", 200);
    const safeUsername = sanitizePromptInput(profile.username ?? "creator", 50);

    const prompt = `Tu es un expert en stratégie de contenu Instagram Reels pour créateurs francophones.

Un créateur Instagram @${safeUsername} (${(profile.followerCount ?? 0).toLocaleString("fr-FR")} abonnés) souhaite créer un réel sur le sujet suivant :

**Idée du réel** : ${safeIdea}

**Profil du créateur** :
- Bio : "${safeBio || "N/A"}"
- Audience principale : ${topGender}, ${topAge} ans, majoritairement en ${topCountry}

${captionsSample ? `**Captions récentes (style, ton, niche)** :\n${captionsSample}\n` : ""}

**Ta mission** :
1. Recherche les tendances actuelles sur Instagram/TikTok/YouTube Shorts dans la niche du créateur liée à ce sujet.
2. Génère **6 idées de captions** pour ce réel :
   - 3 captions ciblant "mon_audience" (l'audience actuelle du créateur — ton familier, références à sa niche, style proche de ses captions habituelles)
   - 3 captions ciblant "audience_optimisee" (l'audience la plus susceptible d'être réactive à ce sujet spécifique — plus large, hooks percutants, vocabulaire viral)
3. Pour chaque caption, fournis aussi une **accroche** (hook) pour les 3 premières secondes du réel.
4. Identifie **3 à 5 tendances** actuelles dans cette niche.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "trendingTopics": ["tendance 1", "tendance 2", "tendance 3"],
  "ideas": [
    {
      "targetMode": "my_audience",
      "audienceDescription": "Description courte de l'audience ciblée",
      "hook": "Accroche pour les 3 premières secondes",
      "caption": "Caption Instagram complète avec emojis et hashtags",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    let raw: string;
    if (getActiveProvider() === "gemini") {
      raw = await generateWithGeminiGrounding(prompt);
    } else {
      raw = await generateText(prompt, { maxTokens: 3000 });
    }

    let parsed: { trendingTopics: string[]; ideas: ReelIdea[] };
    try {
      parsed = JSON.parse(stripJsonFences(raw)) as typeof parsed;
    } catch {
      console.error("Failed to parse Gemini JSON response in /api/reels/ideas");
      return NextResponse.json(
        { success: false, error: "AI returned an unexpected response format" },
        { status: 502, headers }
      );
    }

    if (!Array.isArray(parsed.ideas) || !Array.isArray(parsed.trendingTopics)) {
      return NextResponse.json(
        { success: false, error: "AI response is missing required fields" },
        { status: 502, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ideas: parsed.ideas,
        trendingTopics: parsed.trendingTopics,
      },
      { headers }
    );
  } catch (error) {
    console.error("Error in /api/reels/ideas:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate reel ideas" },
      { status: 500 }
    );
  }
}
