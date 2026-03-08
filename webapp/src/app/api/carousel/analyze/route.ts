import { NextResponse } from "next/server";
import {
  generateText,
  callGeminiVision,
  isAIConfigured,
  stripJsonFences,
  getActiveProvider,
} from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

interface SlideData {
  /** Slide index (0-based) */
  index: number;
  /** Text content of the slide (title + body) */
  text: string;
  /** Base64 data URL of the slide image (optional) */
  imageDataUrl?: string;
}

interface CarouselPost {
  id: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  savedCount: number;
  reach: number;
  slides: SlideData[];
}

interface CarouselAnalyzeRequest {
  posts: CarouselPost[];
  profile: { username: string; followerCount: number };
}

interface SlideAnalysis {
  slideIndex: number;
  slideText: string;
  /** Gemini Vision analysis of slide content (only when images provided) */
  visualAnalysis?: string;
  /** Whether this slide type tends to perform well */
  performanceSignal: "strong" | "weak" | "unknown";
}

interface CarouselAnalysisResult {
  topPerformingSlideTypes: string[];
  topContentAngles: string[];
  weakSlidePatterns: string[];
  slideAnalyses: SlideAnalysis[];
  promptFragment: string;
}

export interface CarouselAnalyzeResponse {
  success: boolean;
  analysis?: CarouselAnalysisResult;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<CarouselAnalyzeResponse>> {
  try {
    const body: CarouselAnalyzeRequest = await request.json();
    const { posts, profile } = body;

    if (!posts?.length) {
      return NextResponse.json({ success: false, error: "No posts provided" }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 501 }
      );
    }

    const provider = getActiveProvider();

    // Sort posts by engagement rate to identify top vs bottom performers
    const withEngagement = posts.map((p) => ({
      ...p,
      engagementRate:
        profile.followerCount > 0 ? (p.likes + p.comments) / profile.followerCount : 0,
    }));
    withEngagement.sort((a, b) => b.engagementRate - a.engagementRate);

    const topPosts = withEngagement.slice(0, Math.ceil(withEngagement.length / 2));
    const bottomPosts = withEngagement.slice(Math.ceil(withEngagement.length / 2));

    // ── Gemini Vision analysis (if provider is Gemini and slides have images) ──
    const slideAnalyses: SlideAnalysis[] = [];
    const postsWithImages = posts.filter((p) => p.slides.some((s) => s.imageDataUrl));

    if (provider === "gemini" && postsWithImages.length > 0) {
      // Analyze top 3 carousel posts with vision
      for (const post of postsWithImages.slice(0, 3)) {
        for (const slide of post.slides.slice(0, 5)) {
          if (!slide.imageDataUrl) continue;
          try {
            // Extract base64 from data URL
            const match = slide.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!match) continue;
            const [, mimeType, base64] = match;

            const visionResult = await callGeminiVision([
              {
                text: `Analyse ce slide de carousel Instagram (slide ${slide.index + 1}) et décris brièvement :
1. Le type de contenu (chiffre choc, question, liste, CTA, storytelling, etc.)
2. Le hook principal (première ligne / titre)
3. Pourquoi ce slide pourrait capter ou perdre l'attention
Réponds en 2-3 phrases max.`,
              },
              {
                inlineData: {
                  mimeType: mimeType ?? "image/png",
                  data: base64 ?? "",
                },
              },
            ]);

            slideAnalyses.push({
              slideIndex: slide.index,
              slideText: slide.text,
              visualAnalysis: visionResult,
              performanceSignal: "unknown",
            });
          } catch {
            // Vision failed for this slide — continue
          }
        }
      }
    }

    // ── Text-based analysis (works for all providers) ──────────────────────
    const topSummary = topPosts
      .slice(0, 5)
      .map(
        (p) =>
          `Carousel "${p.caption.substring(0, 80)}" (${p.likes} likes, ${p.savedCount} saves, ER: ${(p.engagementRate * 100).toFixed(1)}%):
  Slides: ${p.slides.map((s) => `[${s.index + 1}] ${s.text.substring(0, 60)}`).join(" | ")}`
      )
      .join("\n\n");

    const bottomSummary = bottomPosts
      .slice(0, 3)
      .map(
        (p) =>
          `Carousel "${p.caption.substring(0, 80)}" (${p.likes} likes, ER: ${(p.engagementRate * 100).toFixed(1)}%):
  Slides: ${p.slides.map((s) => `[${s.index + 1}] ${s.text.substring(0, 60)}`).join(" | ")}`
      )
      .join("\n\n");

    const visionInsights =
      slideAnalyses.length > 0
        ? `\n\nAnalyse visuelle des slides (IA Vision) :\n${slideAnalyses.map((s) => `- Slide ${s.slideIndex + 1}: ${s.visualAnalysis}`).join("\n")}`
        : "";

    const prompt = `Tu es un expert en stratégie de contenu carousel Instagram.

Compte : @${profile.username} (${profile.followerCount.toLocaleString()} abonnés)

CAROUSELS LES PLUS PERFORMANTS (engagement élevé) :
${topSummary || "Aucune donnée"}

CAROUSELS LES MOINS PERFORMANTS :
${bottomSummary || "Aucune donnée"}
${visionInsights}

Note importante : Instagram n'expose pas les données par slide (quel slide reçoit le like, jusqu'où les gens scrollent).
L'analyse est basée sur l'engagement global du post et le contenu textuel/visuel des slides.

Réponds UNIQUEMENT en JSON strict :
{
  "topPerformingSlideTypes": ["type1", "type2", "type3"],
  "topContentAngles": ["angle1", "angle2", "angle3"],
  "weakSlidePatterns": ["pattern faible 1", "pattern faible 2"],
  "promptFragment": "Phrase courte (1-2 lignes) à injecter dans les prompts de génération de carousel. Ex: Commence par un slide choc avec un chiffre ou une question. Slide 2 = contexte, slides 3-5 = contenu listé, dernier slide = CTA fort."
}

- topPerformingSlideTypes : types de slides qui reviennent dans les carousels performants (ex: "chiffre choc en slide 1", "liste numérotée", "question rhétorique")
- topContentAngles : angles thématiques qui fonctionnent le mieux pour ce créateur
- weakSlidePatterns : patterns à éviter (ex: "slides trop textuels sans accroche visuelle", "CTA absent")
- promptFragment : instruction à injecter dans les futurs prompts carousel`;

    const raw = await generateText(prompt);
    const parsed = JSON.parse(stripJsonFences(raw)) as Partial<CarouselAnalysisResult>;

    const analysis: CarouselAnalysisResult = {
      topPerformingSlideTypes: parsed.topPerformingSlideTypes ?? [],
      topContentAngles: parsed.topContentAngles ?? [],
      weakSlidePatterns: parsed.weakSlidePatterns ?? [],
      slideAnalyses,
      promptFragment: parsed.promptFragment ?? "",
    };

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Error in /api/carousel/analyze:", error);
    return NextResponse.json({ success: false, error: "Analysis failed" }, { status: 500 });
  }
}
