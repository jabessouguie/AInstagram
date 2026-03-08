import { NextResponse } from "next/server";
import { analyseInteractions, analyseInteractionsFromAPI } from "@/lib/interaction-analyser";
import type { InteractionApiResponse } from "@/types/instagram";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse<InteractionApiResponse>> {
  try {
    // Follower/following relationship data is only available in the local Instagram
    // export (privacy restriction prevents Graph API from exposing it).
    // Always try the local export first — even when an API token is present.

    // ── Priority 1: Local Instagram export ────────────────────────────────
    const data = await analyseInteractions();
    if (data) {
      return NextResponse.json({ success: true, data });
    }

    // ── Priority 2: API fallback (returns empty lists with dataSource="api") ─
    const token = request.headers.get("X-Instagram-Token");
    const accountId = request.headers.get("X-Instagram-Account-Id");

    if (token && accountId) {
      const apiData = await analyseInteractionsFromAPI(token, accountId);
      return NextResponse.json({ success: true, data: apiData });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Aucune exportation Instagram trouvée. Téléchargez votre export Instagram et ajoutez-le au dossier data/ pour utiliser cette fonctionnalité.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error in /api/interactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyse interactions." },
      { status: 500 }
    );
  }
}
