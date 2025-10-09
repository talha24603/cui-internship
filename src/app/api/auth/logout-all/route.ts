import { NextResponse } from "next/server";
import { revokeAllUserTokens } from "@/utils/authhelper";

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ 
        error: "User not authenticated" 
      }, { status: 401 });
    }

    // Revoke all refresh tokens for this user
    const result = await revokeAllUserTokens(userId);

    const response = NextResponse.json({ 
      message: "Logged out from all devices successfully",
      revokedCount: result.count
    });

    // Clear current refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout all error:", error);
    return NextResponse.json({ 
      message: "Logout failed" 
    }, { status: 500 });
  }
}
