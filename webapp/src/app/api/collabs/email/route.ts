import { NextResponse } from "next/server";
import { generateText, isAIConfigured, stripJsonFences } from "@/lib/ai-provider";
import type { InstagramProfile } from "@/types/instagram";
import type { CollabMatch } from "@/app/api/collabs/route";

export const dynamic = "force-dynamic";

export interface CollabEmailRequest {
  collab: CollabMatch;
  profile: Partial<InstagramProfile>;
  language?: "fr" | "en";
}

export interface CollabEmailResponse {
  success: boolean;
  data?: { subject: string; body: string };
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<CollabEmailResponse>> {
  try {
    const body: CollabEmailRequest & { feedback?: string } = await request.json();
    const { collab, profile, language = "fr", feedback } = body;

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 501 }
      );
    }

    const lang = language === "fr" ? "français" : "anglais";
    const prompt = `Tu es un créateur de contenu Instagram @${profile.username ?? "creator"} avec ${(profile.followerCount ?? 0).toLocaleString("fr-FR")} abonnés.

Tu veux contacter "${collab.name}" (${collab.type} · ${collab.niche}) pour une collaboration.

Raison identifiée : ${collab.reason}

Rédige un email professionnel mais authentique en ${lang} pour proposer une collaboration.
L'email doit :
- Avoir un objet accrocheur (< 60 chars)
- Commencer par une accroche personnalisée sur leur marque/profil
- Présenter brièvement le créateur et ses stats (${(profile.followerCount ?? 0).toLocaleString("fr-FR")} abonnés, engagement élevé)
- Proposer 2-3 formats de collaboration concrets
- Avoir un ton professionnel mais humain, pas générique
- Inclure un call-to-action clair
- Faire 200-300 mots max

Réponds UNIQUEMENT avec ce JSON (sans markdown ni guillemets autour) :
{
  "subject": "Objet de l'email",
  "body": "Corps complet de l'email"
}${feedback ? `\n\nRetours utilisateur sur la version précédente : ${feedback}` : ""}`;

    const rawText = await generateText(prompt);
    const raw = stripJsonFences(rawText);
    const parsed = JSON.parse(raw);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error in /api/collabs/email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
