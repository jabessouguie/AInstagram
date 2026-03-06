import { NextResponse } from "next/server";
import {
  generateText,
  getActiveProvider,
  isAIConfigured,
  GEMINI_FLASH,
  GEMINI_FLASH_LITE,
  GEMINI_PRO,
} from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

interface ModelResult {
  model: string;
  ok: boolean;
  response?: string;
  latencyMs?: number;
  error?: string;
}

/**
 * GET /api/ai/test
 * Tests configured AI provider and (when Gemini) all three Gemini 3.x models.
 * Returns latency and response excerpt for each.
 */
export async function GET() {
  if (!isAIConfigured()) {
    return NextResponse.json(
      { success: false, error: "No AI provider configured" },
      { status: 501 }
    );
  }

  const provider = getActiveProvider();
  const results: ModelResult[] = [];

  if (provider === "gemini") {
    // Test all three Gemini 3.x tiers
    const models = [
      { id: GEMINI_FLASH, label: "Gemini 3.0 Flash (default)" },
      { id: GEMINI_FLASH_LITE, label: "Gemini 3.1 Flash Lite" },
      { id: GEMINI_PRO, label: "Gemini 3.1 Pro" },
    ];

    for (const { id, label } of models) {
      const t0 = Date.now();
      try {
        const response = await generateText(`Respond with exactly: "OK ${label}"`, {
          model: id,
          maxTokens: 32,
        });
        results.push({ model: id, ok: true, response, latencyMs: Date.now() - t0 });
      } catch (err) {
        results.push({ model: id, ok: false, error: String(err), latencyMs: Date.now() - t0 });
      }
    }
  } else {
    // Non-Gemini: test default model only
    const t0 = Date.now();
    try {
      const response = await generateText('Respond with exactly: "OK"', { maxTokens: 16 });
      results.push({ model: provider, ok: true, response, latencyMs: Date.now() - t0 });
    } catch (err) {
      results.push({ model: provider, ok: false, error: String(err), latencyMs: Date.now() - t0 });
    }
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ success: allOk, provider, results });
}
