import { NextResponse } from "next/server";
import { analyseInteractions } from "@/lib/interaction-analyser";
import type { InteractionApiResponse } from "@/types/instagram";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<InteractionApiResponse>> {
  try {
    const data = await analyseInteractions();
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "No Instagram export data found. Please add your export to data/.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in /api/interactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyse interactions." },
      { status: 500 }
    );
  }
}
