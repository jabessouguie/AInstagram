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
      const fallbackDm = `Salut @${username} ! Je suis tombé sur ton profil et j'ai adoré ton contenu. On partage visiblement les mêmes centres d'intérêts — ce serait cool de se connecter ! 🙌`;
      return NextResponse.json({ success: true, data: { suggestedDm: fallbackDm } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Tu es un créateur de contenu Instagram qui s'appelle @${creatorProfile.username ?? "moi"} avec ${creatorProfile.followerCount?.toLocaleString("fr-FR") ?? "plusieurs milliers"} d'abonnés.

Tu veux envoyer un message privé (DM) à @${username} (profil: ${profileUrl}).
Tu suis ce compte mais il ne te suit pas encore en retour.

Rédige un DM court, authentique, chaleureux et personnalisé en français (2-3 phrases max). Le DM doit :
- Sonner 100% humain, pas robotique
- Mentionner de façon subtile que tu suis leur profil
- Ne pas être trop commercial ou demander un follow
- Avoir une phrase d'accroche naturelle basée sur leur username (${username}) ou leur niche potentielle
- Terminer avec une question ouverte pour engager la conversation

Réponds UNIQUEMENT avec le texte du DM, sans guillemets ni explications.`;

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
