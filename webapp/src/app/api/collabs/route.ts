import { NextResponse } from "next/server";
import { generateText, isAIConfigured, stripJsonFences, GEMINI_PRO } from "@/lib/ai-provider";
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
  contactEmail?: string;
  /** Relevance score 1–10 (10 = most relevant). Used for client-side sorting. */
  relevanceScore?: number;
}

export interface CollabFinderRequest {
  location: string;
  interests: string[];
  profile: Partial<InstagramProfile>;
  /** Names of collabs to avoid re-suggesting (already contacted or not interested) */
  excludeNames?: string[];
  /** How many results to return (default 15, no upper limit) */
  count?: number;
}

export interface CollabFinderResponse {
  success: boolean;
  data?: { collabs: CollabMatch[]; summary: string };
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<CollabFinderResponse>> {
  try {
    const body: CollabFinderRequest = await request.json();
    const { location, interests, profile, excludeNames = [], count = 15 } = body;
    const n = Math.max(1, Math.min(count, 100)); // cap at 100 for sanity

    if (!location || !interests?.length) {
      return NextResponse.json(
        { success: false, error: "Missing location or interests" },
        { status: 400 }
      );
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 501 }
      );
    }

    const followers = profile.followerCount ?? 0;
    const tier =
      followers < 5_000
        ? "nano-influencer (< 5K abonnés) — collabs locales, échanges produits, micro-marques"
        : followers < 20_000
          ? "micro-influencer (5K–20K abonnés) — partenariats rémunérés régionaux, marques mid-range"
          : followers < 100_000
            ? "influencer (20K–100K abonnés) — partenariats rémunérés nationaux, marques connues"
            : "macro-influencer (100K+ abonnés) — grands comptes, agences, contrats significatifs";

    const prompt = `Tu es un expert senior en marketing d'influence et développement commercial pour créateurs de contenu.

Un créateur Instagram cherche des opportunités de collaboration concrètes et réalistes.

### Profil détaillé du créateur
- Username: @${profile.username ?? "creator"}
- Abonnés: ${followers.toLocaleString("fr-FR")} → ${tier}
- Bio Instagram: "${profile.bio ?? "N/A"}"
- Localisation déclarée: ${location}
- Centres d'intérêt / niche: ${interests.join(", ")}

### Ta mission
Identifie exactement ${n} opportunités de collaboration **réalistes et adaptées à son profil** dans ou autour de "${location}". Tu dois faire une recherche approfondie et variée — pas les premières idées qui viennent.

Règles importantes :
1. Calibre les suggestions au niveau du créateur — une suggestion irréaliste (ex: Nike pour un profil à 1 200 abonnés) est inutile.
2. Déduis sa niche principale depuis sa bio et ses centres d'intérêt, puis cherche des partenaires dans cette niche.
3. Mélange les types : marques locales indépendantes, créateurs complémentaires dans la même niche, événements locaux, médias/blogs locaux, boutiques indépendantes, agences, associations professionnelles.
4. Pour les marques, donne des noms réalistes et vérifiables (marques existantes, pas fictives).
${excludeNames.length ? `5. **IMPORTANT** — N'inclus ABSOLUMENT PAS ces entités déjà contactées ou ignorées : ${excludeNames.join(", ")}. Cherche des noms entièrement différents.` : ""}
6. Le potentialRevenue doit être cohérent avec la taille du compte et le marché local.
7. La raison doit expliquer concrètement pourquoi leurs audiences se recoupent.
8. Les instagramHandle doivent être des handles Instagram réels et vérifiables quand tu les connais.
9. Les contactEmail doivent être des emails probables et réalistes (ex: contact@brand.com, hello@brand.fr).
10. **relevanceScore** : attribue un score de 1 à 10 (10 = opportunité la plus pertinente et réaliste pour CE profil). Trie les résultats du plus pertinent (10) au moins pertinent (1).

Réponds UNIQUEMENT avec ce JSON (sans markdown) — le tableau collabs doit contenir exactement ${n} éléments, triés par relevanceScore décroissant :
{
  "summary": "Résumé en 2 phrases des opportunités identifiées, mention du tier du créateur",
  "collabs": [
    {
      "id": "1",
      "name": "Nom réel de la marque/créateur/événement",
      "type": "brand|creator|event|media",
      "niche": "niche spécifique en commun",
      "location": "ville/région précise",
      "reason": "Pourquoi c'est pertinent pour CE créateur avec CES abonnés dans CETTE niche (2 phrases)",
      "instagramHandle": "@handle Instagram si connu",
      "websiteHint": "nom de domaine probable ou terme de recherche",
      "potentialRevenue": "fourchette réaliste selon le tier (ex: échange produit, 50-150€, 300-800€)",
      "contactEmail": "email de contact si connu ou pattern probable (ex: contact@brand.com, partenariats@brand.fr)",
      "relevanceScore": 9
    }
  ]
}`;

    const raw = await generateText(prompt, { model: GEMINI_PRO });
    const rawClean = stripJsonFences(raw);
    const parsed = JSON.parse(rawClean) as { collabs: CollabMatch[]; summary: string };

    // Ensure sorted by relevanceScore descending (in case AI didn't)
    if (parsed.collabs) {
      parsed.collabs.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error in /api/collabs:", error);
    return NextResponse.json({ success: false, error: "Failed to find collabs" }, { status: 500 });
  }
}
