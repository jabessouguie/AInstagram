import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InstagramProfile } from "@/types/instagram";

export const dynamic = "force-dynamic";

export interface CollabMatch {
  id: string;
  name: string;
  type: "brand" | "creator" | "event" | "media";
  niche: string;
  location: string;
  reason: string;
  instagramHandle?: string;
  websiteHint?: string;
  potentialRevenue?: string;
}

export interface CollabFinderRequest {
  location: string;
  interests: string[];
  profile: Partial<InstagramProfile>;
}

export interface CollabFinderResponse {
  success: boolean;
  data?: { collabs: CollabMatch[]; summary: string };
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<CollabFinderResponse>> {
  try {
    const body: CollabFinderRequest = await request.json();
    const { location, interests, profile } = body;

    if (!location || !interests?.length) {
      return NextResponse.json(
        { success: false, error: "Missing location or interests" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured" },
        { status: 501 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "deep-research-pro-preview-12-2025" });

    const prompt = `Tu es un expert en marketing d'influence et développement commercial.

Un créateur Instagram recherche des opportunités de collaboration dans sa région.

### Profil du créateur
- Username: @${profile.username ?? "creator"}
- Abonnés: ${(profile.followerCount ?? 0).toLocaleString("fr-FR")}
- Bio: ${profile.bio ?? "N/A"}
- Localisation: ${location}
- Centres d'intérêt: ${interests.join(", ")}

### Ta mission
Génère exactement 6 opportunités de collaboration pertinentes dans ou autour de "${location}".
Mélange : marques locales, créateurs complémentaires, événements, médias locaux.
Base-toi sur les centres d'intérêt et le profil pour rendre chaque suggestion hyper-pertinente.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "summary": "Résumé en 2 phrases des opportunités identifiées",
  "collabs": [
    {
      "id": "1",
      "name": "Nom de la marque/créateur/événement",
      "type": "brand|creator|event|media",
      "niche": "niche spécifique",
      "location": "ville/région précise",
      "reason": "Pourquoi c'est une bonne collaboration (2 phrases personnalisées)",
      "instagramHandle": "@handle si probable",
      "websiteHint": "indice de recherche (ex: site officiel à trouver)",
      "potentialRevenue": "estimation du revenu potentiel (ex: 200-500€)"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error in /api/collabs:", error);
    return NextResponse.json({ success: false, error: "Failed to find collabs" }, { status: 500 });
  }
}
