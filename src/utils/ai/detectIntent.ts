import Groq from "groq-sdk";

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
}

const VALID_INTENTS = [
  "submit_report",
  "check_deadline",
  "grading_info",
  "supervisor_info",
  "system_overview",
  "unknown",
];

export async function detectIntent(message: string): Promise<string> {
  try {
    const groq = getGroqClient();
    if (!groq) {
      console.warn("GROQ_API_KEY is missing; falling back to unknown intent.");
      return "unknown";
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an intent classifier.

Return ONLY one word from:
submit_report, check_deadline, grading_info, supervisor_info, system_overview

If unsure, return "unknown".
No explanation.
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    let intent = completion.choices[0]?.message?.content?.trim().toLowerCase();

    if (!intent || !VALID_INTENTS.includes(intent)) {
      return "unknown";
    }

    return intent;
  } catch (error) {
    console.error("Groq error:", error);
    return "unknown";
  }
}