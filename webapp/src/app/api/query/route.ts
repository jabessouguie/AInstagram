import { NextResponse } from "next/server";
import { generateText, isAIConfigured } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

interface QueryRequest {
  question: string;
  context: {
    profile?: Record<string, unknown>;
    metrics?: Record<string, unknown>;
    audienceInsights?: Record<string, unknown>;
    contentInteractions?: Record<string, unknown>;
    reachInsights?: Record<string, unknown>;
    recentPosts?: Array<{
      caption: string;
      timestamp: string;
      mediaType: string;
      likes?: number;
      comments?: number;
    }>;
  };
}

interface QueryResponse {
  success: boolean;
  answer?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<QueryResponse>> {
  try {
    const body: QueryRequest = await request.json();
    const { question, context } = body;

    if (!question?.trim()) {
      return NextResponse.json({ success: false, error: "Missing question" }, { status: 400 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "No AI provider configured" },
        { status: 503 }
      );
    }

    const systemPrompt = `You are an Instagram analytics assistant. The creator has given you their Instagram data and is asking a question in natural language. Answer concisely and helpfully. Use numbers and percentages when relevant. If you can't answer from the data provided, say so.

Respond in the same language as the question (French if the question is in French, English if in English).

Here is the creator's Instagram data:

### Profile
${JSON.stringify(context.profile ?? {}, null, 2)}

### Metrics
${JSON.stringify(context.metrics ?? {}, null, 2)}

### Audience Insights
${JSON.stringify(context.audienceInsights ?? {}, null, 2)}

### Content Interactions
${JSON.stringify(context.contentInteractions ?? {}, null, 2)}

### Reach Insights
${JSON.stringify(context.reachInsights ?? {}, null, 2)}

### Recent Posts (last 20)
${JSON.stringify(context.recentPosts ?? [], null, 2)}
`;

    const answer = await generateText(`${systemPrompt}\n\nQuestion: ${question}`);

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("Error in /api/query:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la requête" },
      { status: 500 }
    );
  }
}
