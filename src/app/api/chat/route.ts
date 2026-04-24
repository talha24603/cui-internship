import { NextRequest, NextResponse } from "next/server";
import { detectIntent } from "@/utils/ai/detectIntent";
import { responses } from "@/utils/chat/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Step 1: Detect intent
    const intent = await detectIntent(message);

    // Step 2: Handle intents
    let reply = responses.unknown;

    switch (intent) {
      case "submit_report":
        reply = responses.submit_report;
        break;

      case "grading_info":
        reply = responses.grading_info;
        break;

      case "system_overview":
        reply = responses.system_overview;
        break;

      case "check_deadline":
        reply = responses.check_deadline;
        break;

      case "supervisor_info":
        // later: fetch from DB using userId
        reply = responses.supervisor_info;
        break;

      default:
        reply = responses.unknown;
    }

    return NextResponse.json({
      intent,
      reply,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { reply: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}