import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  CarouselGenerateRequest,
  CarouselGenerateResponse,
  CarouselSlideContent,
} from "@/types/instagram";

export const dynamic = "force-dynamic";

const MODEL_NAME = "gemini-2.0-flash";

function buildCarouselPrompt(req: CarouselGenerateRequest): string {
  const { subject, audience, fonts, numSlides, previousCaptions } = req;

  const captionsSection =
    previousCaptions.length > 0
      ? `### Captions de posts précédents (pour analyser le style et le ton du créateur)\n${previousCaptions
          .slice(0, 15)
          .map((c, i) => `${i + 1}. "${c.substring(0, 150)}"`)
          .join("\n")}`
      : "";

  const audienceDesc = [
    audience.gender !== "all"
      ? audience.gender === "female"
        ? "femmes"
        : "hommes"
      : "tous genres",
    audience.region,
    audience.interests,
  ]
    .filter(Boolean)
    .join(", ");

  return `Tu es un expert en création de contenu Instagram et en design visuel.

Génère le contenu textuel d'un carrousel Instagram de ${numSlides} slides sur le sujet suivant.

### Sujet
${subject}

### Audience cible
${audienceDesc}

### Style typographique demandé
- Titre : police ${fonts.title}
- Sous-titre : police ${fonts.subtitle}
- Corps : police ${fonts.body}

${captionsSection}

### Instructions
1. Analyse le style et le ton des captions précédentes pour aligner le nouveau carrousel avec l'esthétique du créateur.
2. Le carrousel doit être captivant, clair et optimisé pour maximiser la portée sur Instagram.
3. Chaque slide doit avoir : un titre accrocheur (max 8 mots), un sous-titre (max 15 mots), un corps court (max 30 mots).
4. Slide 1 = accroche forte, slides 2-${numSlides - 1} = développement, slide ${numSlides} = call-to-action.
5. Génère aussi une description Instagram optimisée (2-3 phrases + emojis) et 10-15 hashtags pertinents.
6. Le champ photoIndex indique quelle photo utiliser en fond (rotation 0, 1, 2... modulo le nombre de photos dispo — mets juste l'index 0-based).

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "slides": [
    {
      "title": "Titre accrocheur",
      "subtitle": "Sous-titre explicatif",
      "body": "Corps du texte court et impactant",
      "photoIndex": 0
    }
  ],
  "instagramDescription": "Description optimisée pour Instagram avec emojis...",
  "hashtags": ["#hashtag1", "#hashtag2"]
}`;
}

export async function POST(request: Request): Promise<NextResponse<CarouselGenerateResponse>> {
  try {
    const body: CarouselGenerateRequest = await request.json();

    if (!body.subject || !body.numSlides) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: subject, numSlides" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return mock response when API key is missing
      const mockSlides: CarouselSlideContent[] = Array.from({ length: body.numSlides }, (_, i) => ({
        title: i === 0 ? body.subject : `Point ${i + 1}`,
        subtitle: i === body.numSlides - 1 ? "Rejoins la communauté" : `Découvrons ensemble`,
        body:
          i === 0
            ? "Ce que tu dois absolument savoir sur ce sujet fascinant."
            : i === body.numSlides - 1
              ? "Like, enregistre et partage avec quelqu'un qui en a besoin !"
              : "Un insight clé que peu de gens connaissent.",
        photoIndex: i % Math.max(body.photos.length, 1),
      }));
      return NextResponse.json({
        success: true,
        slides: mockSlides,
        instagramDescription: `✨ ${body.subject}\n\nDécouvre les secrets que tu ne savais pas encore. Enregistre ce post pour y revenir ! 💫`,
        hashtags: [
          "#instagram",
          "#contenu",
          "#créateur",
          "#conseil",
          "#partage",
          "#france",
          "#viral",
          "#tendance",
          "#lifestyle",
          "#motivation",
        ],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // If photos are provided, use vision model to analyze them for aesthetic context
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (body.photos.length > 0) {
      parts.push({
        text: "Voici les photos fournies par le créateur pour le carrousel. Analyse leur style visuel (couleurs dominantes, ambiance, composition) pour aligner le contenu textuel.\n",
      });
      // Send up to 3 photos to Gemini for visual analysis
      for (const photo of body.photos.slice(0, 3)) {
        const match = photo.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
      parts.push({ text: "\n" + buildCarouselPrompt(body) });
    } else {
      parts.push({ text: buildCarouselPrompt(body) });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(parts);
    const text = result.response
      .text()
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(text) as {
      slides: CarouselSlideContent[];
      instagramDescription: string;
      hashtags: string[];
    };

    return NextResponse.json({
      success: true,
      slides: parsed.slides,
      instagramDescription: parsed.instagramDescription,
      hashtags: parsed.hashtags,
    });
  } catch (error) {
    console.error("Error in /api/carousel/generate:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération du carrousel" },
      { status: 500 }
    );
  }
}
