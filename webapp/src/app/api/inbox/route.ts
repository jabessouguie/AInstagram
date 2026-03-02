import { NextResponse } from "next/server";
import { InstagramGraphAPI } from "@/lib/instagram-graph-api";
import type { InboxResponse } from "@/types/instagram";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse<InboxResponse>> {
  const token = request.headers.get("X-Instagram-Token");
  const accountId = request.headers.get("X-Instagram-Account-Id");

  if (!token || !accountId) {
    return NextResponse.json({
      success: true,
      data: { comments: [], dataSource: "unavailable" },
    });
  }

  try {
    const api = new InstagramGraphAPI(token, accountId);
    const comments = await api.getInboxComments(20);
    return NextResponse.json({
      success: true,
      data: { comments, dataSource: "api" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur",
      },
      { status: 500 }
    );
  }
}
