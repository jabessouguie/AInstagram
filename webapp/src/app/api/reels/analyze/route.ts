import { NextResponse } from "next/server";
import { generateText, isAIConfigured, stripJsonFences } from "@/lib/ai-provider";
import type {
  InstagramPost,
  InstagramProfile,
  SkipRateAnalysisResponse,
  SkipRateInsights,
} from "@/types/instagram";
import type { ReelsCaptionContext } from "@/lib/content-prompt-context-store";

export const dynamic = "force-dynamic";

interface AnalyzeRequest {
  reels: InstagramPost[];
  profile: InstagramProfile;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]!;
}

export async function POST(request: Request): Promise<NextResponse<SkipRateAnalysisResponse>> {
  try {
    const body: AnalyzeRequest = await request.json();
    const { reels, profile } = body;

    if (!reels?.length) {
      return NextResponse.json({ success: false, error: "No reels provided" }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 500 }
      );
    }

    // Compute median watch time across reels that have the metric
    const reelsWithWatchTime = reels.filter((r) => r.avgWatchTime != null && r.avgWatchTime > 0);
    const medianWatchTime = median(reelsWithWatchTime.map((r) => r.avgWatchTime!));

    // Classify reels by skip risk relative to median
    const classified = reels.map((r) => {
      const wt = r.avgWatchTime ?? 0;
      const risk =
        medianWatchTime > 0
          ? wt < medianWatchTime * 0.6
            ? "high"
            : wt < medianWatchTime * 0.9
              ? "medium"
              : "low"
          : "unknown";
      return { ...r, skipRisk: risk };
    });

    const highRisk = classified.filter((r) => r.skipRisk === "high");
    const lowRisk = classified.filter((r) => r.skipRisk === "low");

    const prompt = `Tu es un expert en stratégie de contenu Instagram Reels.

Compte : @${profile.username} (${profile.followerCount} abonnés)
Temps de visionnage médian : ${medianWatchTime.toFixed(1)}s

Reels avec HAUT risque de skip (temps de visionnage faible, < 60% de la médiane) :
${
  highRisk.length > 0
    ? highRisk
        .slice(0, 10)
        .map(
          (r) =>
            `- Temps moy: ${r.avgWatchTime?.toFixed(1) ?? "?"}s | Portée: ${r.reach} | Caption: "${r.caption.substring(0, 120)}"`
        )
        .join("\n")
    : "Aucun"
}

Reels avec FAIBLE risque de skip (bonne rétention) :
${
  lowRisk.length > 0
    ? lowRisk
        .slice(0, 5)
        .map(
          (r) =>
            `- Temps moy: ${r.avgWatchTime?.toFixed(1) ?? "?"}s | Portée: ${r.reach} | Caption: "${r.caption.substring(0, 120)}"`
        )
        .join("\n")
    : "Aucun"
}

Analyse pourquoi les reels sont skippés dans les 3 premières secondes.

Réponds en JSON strict :
{
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "topSkippedCaptions": ["caption1", "caption2", "caption3"],
  "recommendations": ["reco1", "reco2", "reco3", "reco4"],
  "medianWatchTime": ${medianWatchTime},
  "topThemes": ["thème performant 1", "thème performant 2", "thème performant 3"],
  "bestAngles": ["angle accrocheur 1", "angle accrocheur 2"],
  "skipPatterns": ["à éviter 1", "à éviter 2", "à éviter 3"],
  "promptFragment": "Phrase courte (1-2 lignes) à injecter dans les prompts de génération de captions pour tenir compte de ces insights. Ex: Priorise les hooks visuels percutants dans les 2 premières secondes. Évite les captions trop longues."
}

- patterns : 3-5 raisons concrètes identifiées (ex: "Pas de hook visuel dans les 2 premières secondes", "Captions trop longues avant l'action")
- topSkippedCaptions : les 3 captions des reels les plus à risque (résumées à 60 caractères max)
- recommendations : 4 actions concrètes et actionnables pour améliorer la rétention
- topThemes : thèmes/sujets qui performent le mieux (déduits des captions des reels à faible skip)
- bestAngles : angles et types de hooks qui fonctionnent (ex: "question rhétorique", "chiffre choc")
- skipPatterns : patterns récurrents des reels skippés — à proscrire
- promptFragment : phrase concise à injecter dans les futurs prompts de génération de captions reels`;

    const raw = await generateText(prompt);
    const parsed = JSON.parse(stripJsonFences(raw)) as Partial<
      SkipRateInsights & ReelsCaptionContext & { promptFragment: string }
    >;

    const insights: SkipRateInsights = {
      patterns: parsed.patterns ?? [],
      topSkippedCaptions: parsed.topSkippedCaptions ?? [],
      recommendations: parsed.recommendations ?? [],
      medianWatchTime: medianWatchTime,
    };

    const captionContext = {
      topThemes: (parsed as { topThemes?: string[] }).topThemes ?? [],
      bestAngles: (parsed as { bestAngles?: string[] }).bestAngles ?? [],
      skipPatterns: (parsed as { skipPatterns?: string[] }).skipPatterns ?? [],
      promptFragment: (parsed as { promptFragment?: string }).promptFragment ?? "",
    };

    return NextResponse.json({ success: true, insights, captionContext });
  } catch (error) {
    console.error("Error in /api/reels/analyze:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
