import OpenAI from "openai";

export type AiReportAssessment = {
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestedMarks: {
    faculty: number;
    site: number;
    office: number;
    total: number;
  };
  feedbackDraft: string;
  confidence: "low" | "medium" | "high";
};

type EvaluateInternshipReportInput = {
  reportText: string;
  studentSummary?: string | null;
  internshipId: string;
};

function getGrokClient(): OpenAI | null {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });
}

function safeJsonParse(content: string): AiReportAssessment | null {
  try {
    const cleaned = content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned) as AiReportAssessment;

    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.summary || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.concerns)) {
      return null;
    }
    if (!parsed.suggestedMarks || typeof parsed.feedbackDraft !== "string") return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function evaluateInternshipReportWithGrok(
  input: EvaluateInternshipReportInput,
): Promise<AiReportAssessment | null> {
  const client = getGrokClient();
  if (!client) return null;

  const model = process.env.GROK_MODEL || "grok-3-mini";
  const reportText = input.reportText.slice(0, 18000);
  const summary = (input.studentSummary || "").slice(0, 3000);

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an internship evaluation assistant. Return ONLY valid JSON. Do not include markdown fences.",
      },
      {
        role: "user",
        content: `Evaluate the following internship report and return JSON with this exact shape:
{
  "summary": "string",
  "strengths": ["string"],
  "concerns": ["string"],
  "suggestedMarks": {
    "faculty": number,
    "site": number,
    "office": number,
    "total": number
  },
  "feedbackDraft": "string",
  "confidence": "low|medium|high"
}

Rules:
- Suggested marks should follow: faculty max 40, site max 40, office max 20, total max 100.
- Keep suggestions evidence-based from the report content.
- If evidence is weak, lower confidence.
- Keep summary concise (max 120 words).

Context:
- internshipId: ${input.internshipId}
- studentSummary: ${summary || "N/A"}

Report text:
${reportText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || "";
  return safeJsonParse(content);
}
