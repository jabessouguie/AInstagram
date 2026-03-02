import { NextResponse } from "next/server";
import { InstagramGraphAPI } from "@/lib/instagram-graph-api";
import type { InboxReplyRequest, InboxReplyResponse } from "@/types/instagram";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse<InboxReplyResponse>> {
  const token = request.headers.get("X-Instagram-Token");
  const accountId = request.headers.get("X-Instagram-Account-Id");

  if (!token || !accountId) {
    return NextResponse.json({ success: false, error: "API token required" }, { status: 401 });
  }

  const body: InboxReplyRequest = await request.json();

  if (!body.message?.trim()) {
    return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
  }

  try {
    const api = new InstagramGraphAPI(token, accountId);
    let result: { id: string };

    if (body.commentId) {
      result = await api.replyToComment(body.commentId, body.message);
    } else if (body.mediaId) {
      result = await api.createComment(body.mediaId, body.message);
    } else {
      return NextResponse.json(
        { success: false, error: "commentId or mediaId required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
