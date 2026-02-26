import { NextResponse } from "next/server";
import { parseInstagramExport } from "@/lib/instagram-parser";
import { mockAnalytics } from "@/lib/mock-data";
import type { DataApiResponse } from "@/types/instagram";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse<DataApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const data = await parseInstagramExport(from, to);

    if (data) {
      return NextResponse.json({ success: true, data });
    }

    // Fall back to mock data if no export found
    return NextResponse.json({
      success: true,
      data: mockAnalytics,
    });
  } catch (error) {
    console.error("Error in /api/data:", error);
    // Always return mock data as fallback
    return NextResponse.json({ success: true, data: mockAnalytics });
  }
}
