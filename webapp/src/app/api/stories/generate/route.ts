import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  CarouselGenerateRequest,
  CarouselGenerateResponse,
  CarouselSlideContent,
} from "@/types/instagram";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "gemini-2.5-flash";

function buildStoryPrompt(req: CarouselGenerateRequest): string {
  const { subject, audience, numSlides, previousCaptions, language = "en" } = req;

  const lang = language === "fr" ? "French" : "English";

  const captionsSection =
    previousCaptions.length > 0
      ? `### Creator's previous captions (analyse voice, tone, style — mirror it)\n${previousCaptions
          .slice(0, 10)
          .map((c, i) => `${i + 1}. "${c.substring(0, 150)}"`)
          .join("\n")}`
      : "";

  const genderLabel =
    audience.gender === "female" ? "women" : audience.gender === "male" ? "men" : "everyone";

  const audienceDesc = [genderLabel, audience.region, audience.interests]
    .filter(Boolean)
    .join(", ");

  return `You are an Instagram Stories content creator. Stories are vertical (9:16) and must be punchy, fast, and visual.

Generate the text content for ${numSlides} Instagram Story slides in ${lang}.

### Subject
${subject}

### Target audience
${audienceDesc}

${captionsSection}

### Story slide rules
- Write every word in ${lang}. No other language.
- Each slide has a TITLE only (max 5 words). No subtitle field needed — set subtitle to "".
- Body: max 20 words. Conversational, punchy, direct.
- Slide 1: scroll-stopping hook — bold statement or question (max 5 words)
- Slides 2–${numSlides - 1}: one quick tip or surprising fact per slide
- Slide ${numSlides}: strong CTA — "Save this", "Follow for more", "Share with a friend"
- Tone: bold, direct, authentic — no fluff, no filler
- Sentence case: only first word capitalised, never after a colon
- NEVER use exclamation marks in titles unless a question
- photoIndex: rotate 0, 1, 2… (modulo number of available photos). -1 = gradient

### Instagram description (also in ${lang})
- Structure: hook → value → CTA
- Max 3 emojis
- 3–5 lowercase hashtags at the end

Reply ONLY with this JSON (no markdown fences, no extra text):
{
  "slides": [
    {
      "title": "Short punchy hook",
      "subtitle": "",
      "body": "One powerful sentence that makes them swipe",
      "photoIndex": 0
    }
  ],
  "instagramDescription": "Full caption for the story series...",
  "hashtags": ["#tag1", "#tag2"]
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
      const isFr = body.language === "fr";
      const mockSlides: CarouselSlideContent[] = Array.from({ length: body.numSlides }, (_, i) => ({
        title:
          i === 0
            ? body.subject
            : i === body.numSlides - 1
              ? isFr
                ? "Suis pour la suite"
                : "Follow for more"
              : isFr
                ? `Astuce ${i}`
                : `Tip ${i}`,
        subtitle: "",
        body:
          i === body.numSlides - 1
            ? isFr
              ? "Partage si ça t'a aidé."
              : "Share if this helped."
            : isFr
              ? "Une vérité que personne ne dit."
              : "A truth nobody talks about.",
        photoIndex: i % Math.max(body.photos.length, 1),
      }));
      return NextResponse.json({
        success: true,
        slides: mockSlides,
        instagramDescription: isFr
          ? `${body.subject}\n\nTout en stories. Swipe.`
          : `${body.subject}\n\nAll in stories. Swipe.`,
        hashtags: isFr
          ? ["#stories", "#créateur", "#conseil", "#france", "#viral"]
          : ["#stories", "#tips", "#creator", "#realtalk", "#viral"],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (body.photos.length > 0) {
      parts.push({
        text: "Voici les photos fournies pour les stories. Analyse leur ambiance visuelle pour aligner le contenu.\n",
      });
      for (const photo of body.photos.slice(0, 3)) {
        const match = photo.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
      parts.push({ text: "\n" + buildStoryPrompt(body) });
    } else {
      parts.push({ text: buildStoryPrompt(body) });
    }

    const model = genAI.getGenerativeModel({ model: body.model ?? DEFAULT_MODEL });
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
    console.error("Error in /api/stories/generate:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération des stories" },
      { status: 500 }
    );
  }
}
