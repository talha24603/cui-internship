import Groq from "groq-sdk";
import type { RetrievalDecision, RetrievedHelpItem } from "@/utils/chat/retrieval";

type GenerateHelpReplyInput = {
  message: string;
  role: string;
  currentRoute?: string;
  retrievedContext: RetrievedHelpItem[];
  retrievalDecision?: RetrievalDecision;
  conversationSummary?: string;
};

function getGroqClient() {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function buildContextBlock(context: RetrievedHelpItem[]) {
  return context
    .slice(0, 2)
    .map((item, index) => {
      return [
        `Source ${index + 1}: ${item.title}`,
        `Module: ${item.module}`,
        `Scope: ${item.roleScope.join(", ")}`,
        `Content: ${item.content}`,
        `Steps: ${item.steps.join(" | ")}`,
      ].join("\n");
    })
    .join("\n\n");
}

function roleScopeFromContext(context: RetrievedHelpItem[]) {
  const roles = new Set<string>();
  for (const item of context) {
    for (const role of item.roleScope) roles.add(role);
  }
  if (roles.size === 0) return "ALL roles (generic guidance)";
  return [...roles].join(", ");
}

function isSmallTalkMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;
  const compact = normalized.replace(/[^\w\s]/g, "");
  const greetings = new Set([
    "hi",
    "hello",
    "hey",
    "ok",
    "okay",
    "thanks",
    "thank you",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
  ]);
  if (greetings.has(compact)) return true;

  const words = compact.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && words.every((w) => ["hi", "hello", "hey", "thanks", "okay", "ok"].includes(w))) {
    return true;
  }
  return false;
}

function isAssistantCapabilityQuestion(message: string) {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;

  const compact = normalized.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const patterns = [
    /\bwhat can you do\b/,
    /\bwhat do you do\b/,
    /\bwhat you do\b/,
    /\bwho are you\b/,
    /\bhow can you help\b/,
    /\bhelp me with\b/,
    /\byour purpose\b/,
    /\bwhat is your role\b/,
  ];

  return patterns.some((pattern) => pattern.test(compact));
}

function formatStructuredAnswer(params: {
  shortAnswer: string;
  steps: string[];
  roleScope: string;
  confidence: "high" | "medium" | "low";
}) {
  const steps = params.steps.length > 0 ? params.steps : ["Follow the module flow shown in your dashboard."];

  return [
    "### Short answer",
    params.shortAnswer.trim(),
    "",
    "### What to do",
    ...steps.slice(0, 3).map((step, index) => `${index + 1}. ${step}`),
    "",
    "### Who can do this",
    `- ${params.roleScope}`,
    "",
    "### Confidence",
    params.confidence,
  ].join("\n");
}

function enforceStructuredFormat(raw: string, fallback: string) {
  const normalized = raw.trim();
  const orderedHeadingPatterns = [
    /^### Short answer\s*$/m,
    /^### What to do\s*$/m,
    /^### Who can do this\s*$/m,
    /^### Confidence\s*$/m,
  ];
  const headingPositions = orderedHeadingPatterns.map((pattern) => normalized.search(pattern));
  const hasAllHeadings = headingPositions.every((pos) => pos >= 0);
  if (!hasAllHeadings) return fallback;

  const isOrdered = headingPositions.every((pos, index) => index === 0 || pos > headingPositions[index - 1]);
  if (!isOrdered) return fallback;

  const confidenceMatch = normalized.match(/^### Confidence\s*$[\r\n]+(high|medium|low)\s*$/im);
  if (!confidenceMatch) return fallback;

  const hasNumberedSteps = /^\d+\.\s+/m.test(normalized);
  const hasRoleBullet = /^### Who can do this\s*$[\r\n]+-\s+/im.test(normalized);
  if (!hasNumberedSteps || !hasRoleBullet) return fallback;

  return normalized;
}

function buildDeterministicReply(input: GenerateHelpReplyInput) {
  const top = input.retrievedContext[0];
  if (!top) {
    const structured = formatStructuredAnswer({
      shortAnswer:
        "I could not find enough help context for that. Please rephrase with the exact task or page name.",
      steps: ["Mention the module name (for example, internships, reports, or evaluation summary)."],
      roleScope: "ALL roles (generic guidance)",
      confidence: "low",
    });
    return {
      answer: structured,
      confidence: "low" as const,
    };
  }

  const topContexts = input.retrievedContext.slice(0, 3);
  const mergedSteps = topContexts.flatMap((item) => item.steps).filter(Boolean).slice(0, 3);
  const coveredModules = [...new Set(topContexts.map((item) => item.title))].slice(0, 2);
  const calibratedConfidence = top.score > 1 ? (top.score >= 9 ? "high" : "medium") : top.score >= 0.72 ? "high" : "medium";

  const answer = formatStructuredAnswer({
    shortAnswer: `${top.content} (Primary source: ${top.title}${
      coveredModules.length > 1 ? `; also used: ${coveredModules.slice(1).join(", ")}` : ""
    })`,
    steps: mergedSteps,
    roleScope: roleScopeFromContext(input.retrievedContext),
    confidence: calibratedConfidence,
  });
  const confidence = calibratedConfidence;
  return { answer, confidence };
}

function buildClarificationReply(input: GenerateHelpReplyInput) {
  const options = input.retrievedContext
    .slice(0, 3)
    .map((item) => item.title)
    .filter(Boolean);

  const uniqueOptions = [...new Set(options)];
  const clarification =
    uniqueOptions.length >= 2
      ? `I’m not fully sure which module you mean. Did you mean ${uniqueOptions
          .slice(0, -1)
          .join(", ")}${uniqueOptions.length > 1 ? `, or ${uniqueOptions.at(-1)}` : ""}?`
      : "I’m not fully sure which module you mean yet.";

  return {
    answer: [
      "### Short answer",
      clarification,
      "",
      "### What to do",
      "1. Mention the exact module, page, or form name.",
      "2. Include your role if the workflow is role-specific.",
      "3. If possible, ask using the exact system term such as AppEx-A, AppEx-B, weekly logs, final report, or evaluation summary.",
      "",
      "### Who can do this",
      "- ALL roles (generic guidance)",
      "",
      "### Confidence",
      "low",
    ].join("\n"),
    confidence: "low" as const,
  };
}

function shouldUseDeterministicReply(input: GenerateHelpReplyInput) {
  const top = input.retrievedContext[0];
  if (!top) return true;

  const second = input.retrievedContext[1];
  const shortMessage = input.message.trim().split(/\s+/).filter(Boolean).length <= 8;
  const scoreGap = top.score - (second?.score ?? 0);

  // Lexical fast-path scores are typically larger than semantic/hybrid scores.
  const hasVeryStrongLexicalMatch = top.score > 1 && top.score >= 9 && scoreGap >= 2;
  const hasStrongSemanticMatch = top.score <= 1 && top.score >= 0.84 && scoreGap >= 0.12;

  return shortMessage && (hasVeryStrongLexicalMatch || hasStrongSemanticMatch);
}

export async function generateHelpReply(input: GenerateHelpReplyInput) {
  if (isSmallTalkMessage(input.message)) {
    return {
      answer: "Hello! How can I help you with the internship portal today?",
      confidence: "high" as const,
    };
  }

  if (isAssistantCapabilityQuestion(input.message)) {
    return {
      answer: [
        "### Short answer",
        "I guide users about how this internship portal works, including workflows, permissions, statuses, and common issues.",
        "",
        "### What to do",
        "1. Ask about a module or process such as AppEx-A, AppEx-B, weekly logs, final report, evaluation, announcements, or company requests.",
        "2. Mention your role or page if the workflow is role-specific.",
        "3. If you get an unexpected error or status, ask with the exact message or module name.",
        "",
        "### Who can do this",
        "- ALL roles (generic guidance)",
        "",
        "### Confidence",
        "high",
      ].join("\n"),
      confidence: "high" as const,
    };
  }

  if (input.retrievalDecision?.kind === "ambiguous") {
    return buildClarificationReply(input);
  }

  if (shouldUseDeterministicReply(input)) {
    return buildDeterministicReply(input);
  }

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

Return output in EXACT markdown headings and order:
### Short answer
<1-2 lines>

### What to do
1. <step>
2. <step>
3. <step max>

### Who can do this
- <role scope from context only>

### Confidence
high|medium|low

Rules:
- Use only provided context.
- Do not invent endpoints, permissions, or routes.
- Max 3 steps.
- Keep total response concise and scannable.`,
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

    const fallbackStructured = formatStructuredAnswer({
      shortAnswer: input.retrievedContext[0]?.content || "Follow role-specific dashboard guidance for this task.",
      steps: input.retrievedContext[0]?.steps || [],
      roleScope: roleScopeFromContext(input.retrievedContext),
      confidence: confidence as "high" | "medium" | "low",
    });

    return {
      answer: enforceStructuredFormat(content, fallbackStructured),
      confidence: confidence as "high" | "medium" | "low",
    };
  } catch {
    return buildDeterministicReply(input);
  }
}
