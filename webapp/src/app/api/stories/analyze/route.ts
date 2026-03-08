import { NextResponse } from "next/server";
import {
  generateText,
  callGeminiVision,
  isAIConfigured,
  stripJsonFences,
  getActiveProvider,
} from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

interface StoryData {
  id: string;
  caption?: string;
  /** replies + link taps as a proxy for engagement (story impressions not always available) */
  replies: number;
  impressions: number;
  linkTaps?: number;
  /** base64 data URL of the story image/frame (optional) */
  imageDataUrl?: string;
  /** Story type hint from the creator */
  storyType?: "question" | "poll" | "link" | "product" | "text" | "photo" | "video" | "other";
}

interface StoriesAnalyzeRequest {
  stories: StoryData[];
  profile: { username: string; followerCount: number };
}

interface StoriesAnalysisResult {
  topStoryFormats: string[];
  bestEngagementDrivers: string[];
  weakPatterns: string[];
  promptFragment: string;
}

export interface StoriesAnalyzeResponse {
  success: boolean;
  analysis?: StoriesAnalysisResult;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<StoriesAnalyzeResponse>> {
  try {
    const body: StoriesAnalyzeRequest = await request.json();
    const { stories, profile } = body;

    if (!stories?.length) {
      return NextResponse.json({ success: false, error: "No stories provided" }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 501 }
      );
    }

    const provider = getActiveProvider();

    // Sort by engagement (replies + link taps / impressions)
    const withEngagement = stories.map((s) => ({
      ...s,
      engagementRate: s.impressions > 0 ? (s.replies + (s.linkTaps ?? 0)) / s.impressions : 0,
    }));
    withEngagement.sort((a, b) => b.engagementRate - a.engagementRate);

    const topStories = withEngagement.slice(0, Math.ceil(withEngagement.length / 2));
    const bottomStories = withEngagement.slice(Math.ceil(withEngagement.length / 2));

    // ── Gemini Vision analysis for stories with images ──────────────────────
    const visionInsights: string[] = [];
    if (provider === "gemini") {
      const storiesWithImages = topStories.filter((s) => s.imageDataUrl).slice(0, 4);
      for (const story of storiesWithImages) {
        try {
          const match = story.imageDataUrl!.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) continue;
          const [, mimeType, base64] = match;
          const result = await callGeminiVision([
            {
              text: `Analyse cette story Instagram et décris brièvement :
1. Le type de story (sondage, question, lien, texte, photo, etc.)
2. L'accroche principale
3. Pourquoi elle pourrait générer des interactions (réponses, taps)
Réponds en 2 phrases max.`,
            },
            { inlineData: { mimeType: mimeType ?? "image/jpeg", data: base64 ?? "" } },
          ]);
          visionInsights.push(result);
        } catch {
          // Vision failed — continue
        }
      }
    }

    const topSummary = topStories
      .slice(0, 6)
      .map(
        (s) =>
          `Story type:${s.storyType ?? "?"} | Réponses:${s.replies} | Impressions:${s.impressions} | ER:${(s.engagementRate * 100).toFixed(1)}%${s.caption ? ` | "${s.caption.substring(0, 60)}"` : ""}`
      )
      .join("\n");

    const bottomSummary = bottomStories
      .slice(0, 3)
      .map(
        (s) =>
          `Story type:${s.storyType ?? "?"} | Réponses:${s.replies} | ER:${(s.engagementRate * 100).toFixed(1)}%`
      )
      .join("\n");

    const visionSection =
      visionInsights.length > 0
        ? `\n\nAnalyse visuelle IA des stories les plus performantes :\n${visionInsights.map((v, i) => `${i + 1}. ${v}`).join("\n")}`
        : "";

    const prompt = `Tu es un expert en stratégie de contenu Instagram Stories.

Compte : @${profile.username} (${profile.followerCount.toLocaleString()} abonnés)

STORIES LES PLUS PERFORMANTES (taux d'engagement élevé) :
${topSummary || "Aucune donnée"}

STORIES LES MOINS PERFORMANTES :
${bottomSummary || "Aucune donnée"}
${visionSection}

Réponds UNIQUEMENT en JSON strict :
{
  "topStoryFormats": ["format1", "format2", "format3"],
  "bestEngagementDrivers": ["driver1", "driver2", "driver3"],
  "weakPatterns": ["faible1", "faible2"],
  "promptFragment": "Phrase courte (1-2 lignes) à injecter dans les prompts de génération de stories. Ex: Utilise des sondages et questions ouvertes pour maximiser les réponses. Commence par une accroche visuelle forte."
}

- topStoryFormats : types de stories qui performent le mieux (ex: "sondage", "question ouverte", "reveal en 2 slides")
- bestEngagementDrivers : éléments qui déclenchent les interactions (réponses, taps link, swipe up)
- weakPatterns : patterns à éviter dans les stories
- promptFragment : instruction à injecter dans les futurs prompts de génération de stories`;

    const raw = await generateText(prompt);
    const parsed = JSON.parse(stripJsonFences(raw)) as Partial<StoriesAnalysisResult>;

    return NextResponse.json({
      success: true,
      analysis: {
        topStoryFormats: parsed.topStoryFormats ?? [],
        bestEngagementDrivers: parsed.bestEngagementDrivers ?? [],
        weakPatterns: parsed.weakPatterns ?? [],
        promptFragment: parsed.promptFragment ?? "",
      },
    });
  } catch (error) {
    console.error("Error in /api/stories/analyze:", error);
    return NextResponse.json({ success: false, error: "Analysis failed" }, { status: 500 });
  }
}
