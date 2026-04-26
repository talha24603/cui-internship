import Groq from "groq-sdk";
import type { RetrievedHelpItem } from "@/utils/chat/retrieval";

type GenerateHelpReplyInput = {
  message: string;
  role: string;
  currentRoute?: string;
  retrievedContext: RetrievedHelpItem[];
  conversationSummary?: string;
};

function getGroqClient() {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function buildContextBlock(context: RetrievedHelpItem[]) {
  return context
    .map((item, index) => {
      return [
        `Source ${index + 1}: ${item.title}`,
        `Module: ${item.module}`,
        `Scope: ${item.roleScope.join(", ")}`,
        `Content: ${item.content}`,
        `Steps: ${item.steps.join(" | ")}`,
        `Blockers: ${item.blockers.join(" | ")}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildDeterministicReply(input: GenerateHelpReplyInput) {
  const top = input.retrievedContext[0];
  if (!top) {
    return {
      answer:
        "I could not find enough help context for that. Please try rephrasing your question with the exact task or page.",
      confidence: "low" as const,
    };
  }

  const steps = top.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
  const blockers = top.blockers.map((blocker) => `- ${blocker}`).join("\n");
  const answer = `Here is the best guidance for your request (${top.title}):\n\n${steps}\n\nCommon blockers:\n${blockers}`;
  const confidence = top.score >= 7 ? ("high" as const) : ("medium" as const);
  return { answer, confidence };
}

export async function generateHelpReply(input: GenerateHelpReplyInput) {
  const client = getGroqClient();
  if (!client) {
    return buildDeterministicReply(input);
  }

  const model = process.env.GROK_MODEL || "openai/gpt-oss-20b";
  const contextBlock = buildContextBlock(input.retrievedContext);

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a role-aware help assistant for an internship portal. Use only provided context. Do not invent endpoints or permissions. Keep answer concise with practical steps.",
        },
        {
          role: "user",
          content: `User role: ${input.role}
Current route: ${input.currentRoute || "unknown"}
Recent conversation:
${input.conversationSummary || "none"}

User question:
${input.message}

Allowed context:
${contextBlock}

Output format:
- Short answer (1-2 lines)
- Steps (numbered)
- Common blockers (bullets)
- Confidence: high|medium|low`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return buildDeterministicReply(input);

    const lowered = content.toLowerCase();
    const confidence = lowered.includes("confidence: high")
      ? "high"
      : lowered.includes("confidence: low")
      ? "low"
      : "medium";

    return { answer: content, confidence: confidence as "high" | "medium" | "low" };
  } catch {
    return buildDeterministicReply(input);
  }
}
