import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

interface BugReportRequest {
  screenshot?: string; // base64 PNG
  description?: string;
  pageUrl?: string;
  userAgent?: string;
}

interface BugReportResponse {
  success: boolean;
  issueUrl?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<BugReportResponse>> {
  try {
    const body: BugReportRequest = await request.json();
    const { screenshot, description, pageUrl, userAgent } = body;

    if (!screenshot && !description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Fournissez une capture d'écran ou une description" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const gitlabToken = process.env.GITLAB_TOKEN;
    const gitlabProjectId = process.env.GITLAB_PROJECT_ID;
    const gitlabUrl = process.env.GITLAB_URL ?? "https://gitlab.com";

    // ── Step 1: Analyse with Gemini ───────────────────────────────────────────
    let issueTitle = "Bug signalé par un utilisateur";
    let issueBody = "";

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

      const contextText = [
        pageUrl ? `Page : ${pageUrl}` : "",
        userAgent ? `Navigateur : ${userAgent}` : "",
        description ? `Description utilisateur : ${description}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const parts: Parameters<typeof model.generateContent>[0] = [];

      if (screenshot) {
        parts.push({
          inlineData: { mimeType: "image/png", data: screenshot },
        });
      }

      parts.push(`Tu es un assistant de triage de bugs pour une application web d'analyse Instagram.

Analyse ${screenshot ? "cette capture d'écran" : "la description ci-dessous"} et identifie le problème.

Contexte :
${contextText}

Génère un titre d'issue court (max 80 caractères) et une description markdown détaillée avec :
- Ce qui est visible / décrit comme problème
- La page / fonctionnalité affectée
- Les étapes possibles pour reproduire (si identifiables)
- Le niveau de sévérité estimé (low / medium / high / critical)

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "title": "Titre court de l'issue",
  "body": "Description markdown complète",
  "severity": "low|medium|high|critical"
}`);

      const result = await model.generateContent(parts);
      const raw = result.response
        .text()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      try {
        const parsed = JSON.parse(raw) as {
          title: string;
          body: string;
          severity: string;
        };
        issueTitle = parsed.title ?? issueTitle;
        issueBody = `${parsed.body ?? ""}\n\n---\n**Sévérité estimée :** ${parsed.severity ?? "?"}\n**Page :** ${pageUrl ?? "N/A"}\n**Navigateur :** ${userAgent ?? "N/A"}`;
      } catch {
        issueBody = description ?? "Pas de description fournie.";
      }
    } else {
      // No Gemini key — use raw description
      issueTitle = description?.substring(0, 80) ?? "Bug signalé";
      issueBody = `**Description :** ${description ?? "—"}\n\n**Page :** ${pageUrl ?? "N/A"}\n**Navigateur :** ${userAgent ?? "N/A"}`;
    }

    // ── Step 2: Create GitLab issue ───────────────────────────────────────────
    if (!gitlabToken || !gitlabProjectId) {
      // No GitLab credentials configured — return the draft so the user can see it
      return NextResponse.json({
        success: true,
        issueUrl: undefined,
      });
    }

    const encodedProjectId = encodeURIComponent(gitlabProjectId);
    const gitlabRes = await fetch(`${gitlabUrl}/api/v4/projects/${encodedProjectId}/issues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": gitlabToken,
      },
      body: JSON.stringify({
        title: issueTitle,
        description: issueBody,
        labels: "bug",
      }),
    });

    if (!gitlabRes.ok) {
      const errText = await gitlabRes.text();
      console.error("GitLab issue creation failed:", errText);
      return NextResponse.json(
        { success: false, error: "Impossible de créer l'issue GitLab" },
        { status: 502 }
      );
    }

    const issue = (await gitlabRes.json()) as { web_url: string };
    return NextResponse.json({ success: true, issueUrl: issue.web_url });
  } catch (error) {
    console.error("Error in /api/bug-report:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du rapport" },
      { status: 500 }
    );
  }
}
