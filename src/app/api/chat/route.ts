import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/utils/authhelper";
import { retrieveHelpContext } from "@/utils/chat/retrieval";
import { appendConversationTurns, summarizeRecentContext } from "@/utils/chat/memory";
import { generateHelpReply } from "@/utils/chat/generateHelpReply";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentRoute, conversationId: incomingConversationId } = body ?? {};

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let role = "ALL";

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = verifyAccessToken(token);
        userId = String(payload.sub || "");
        role = String(payload.role || "ALL");
      } catch {
        // Graceful fallback for unauthenticated users.
      }
    }

    const conversationId =
      typeof incomingConversationId === "string" && incomingConversationId.trim()
        ? incomingConversationId
        : crypto.randomUUID();

    const recentSummary = summarizeRecentContext(conversationId);
    const retrievalDecision = await retrieveHelpContext({
      query: message,
      role,
      currentRoute: typeof currentRoute === "string" ? currentRoute : undefined,
      topK: 5,
    });
    const retrieved = retrievalDecision.items;

    const generated = await generateHelpReply({
      message,
      role,
      currentRoute: typeof currentRoute === "string" ? currentRoute : undefined,
      retrievedContext: retrieved,
      retrievalDecision,
      conversationSummary: recentSummary,
    });

    appendConversationTurns(conversationId, message, generated.answer);

    return NextResponse.json(
      {
        conversationId,
        reply: generated.answer,
        confidence: generated.confidence,
        role,
        userId,
        sources: retrieved.map((item) => ({
          id: item.id,
          title: item.title,
          module: item.module,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { reply: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}