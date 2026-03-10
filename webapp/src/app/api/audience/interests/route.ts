import { NextResponse } from "next/server";
import { generateText, isAIConfigured, stripJsonFences } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

interface AudienceInterestsRequest {
  bio?: string;
  posts?: Array<{ caption: string }>;
  topCountries?: string[];
  topAgeGroups?: string[];
  genderSplit?: { male: number; female: number };
}

interface AudienceInterestsResponse {
  success: boolean;
  interests?: string[];
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<AudienceInterestsResponse>> {
  try {
    const body: AudienceInterestsRequest = await request.json();
    const { bio, posts, topCountries, topAgeGroups, genderSplit } = body;

    if (!isAIConfigured()) {
      // Fallback: extract keywords from bio
      const bioKeywords =
        bio
          ?.split(/[,.\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2)
          .slice(0, 5) ?? [];
      return NextResponse.json({
        success: true,
        interests: bioKeywords.length ? bioKeywords : ["lifestyle", "contenu créatif"],
      });
    }

    const captionsSample =
      posts
        ?.slice(0, 10)
        .map((p, i) => `${i + 1}. "${p.caption.substring(0, 150)}"`)
        .join("\n") ?? "";

    const genderLabel =
      (genderSplit?.female ?? 50) >= (genderSplit?.male ?? 50)
        ? "principalement féminine"
        : "principalement masculine";

    const prompt = `Tu es un expert en analyse d'audience Instagram.

Analyse les données suivantes d'un créateur Instagram et identifie les centres d'intérêt principaux de son audience.

### Données disponibles
${bio ? `- Bio du créateur : "${bio}"` : ""}
${topCountries?.length ? `- Pays principaux de l'audience : ${topCountries.join(", ")}` : ""}
${topAgeGroups?.length ? `- Tranches d'âge principales : ${topAgeGroups.join(", ")} ans` : ""}
${genderSplit ? `- Genre de l'audience : ${genderLabel}` : ""}
${captionsSample ? `\n### Captions récentes du créateur\n${captionsSample}` : ""}

### Instructions
Identifie **5 à 8 centres d'intérêt** caractéristiques de cette audience.
- Courts (1-3 mots), pertinents, en français
- Exemples : fitness, lifestyle, entrepreneuriat, beauté, voyage, food, tech, mode, développement personnel, photographie, gaming

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{"interests": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]}`;

    const raw = await generateText(prompt, { maxTokens: 200 });
    const parsed = JSON.parse(stripJsonFences(raw)) as { interests: string[] };

    return NextResponse.json({ success: true, interests: parsed.interests });
  } catch (error) {
    console.error("Error in /api/audience/interests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract interests" },
      { status: 500 }
    );
  }
}
