import { NextResponse } from "next/server";
import { getUserActiveSessions } from "@/utils/authhelper";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ 
        error: "User not authenticated" 
      }, { status: 401 });
    }

    // Get all active sessions for user
    const sessions = await getUserActiveSessions(userId);

    // Get current session token from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const currentToken = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("refreshToken="))
      ?.split("=")[1];

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.token === currentToken,
      // Don't expose the actual token for security
      tokenPreview: session.token.substring(0, 8) + '...'
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      totalActive: sessions.length
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json({ 
      error: "Failed to get sessions" 
    }, { status: 500 });
  }
}
