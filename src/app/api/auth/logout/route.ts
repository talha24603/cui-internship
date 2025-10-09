import { NextResponse } from "next/server";
import { revokeRefreshToken } from "@/utils/authhelper";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const refreshToken = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("refreshToken="))
      ?.split("=")[1];

    if (!refreshToken) {
      return NextResponse.json({ 
        message: "No active session found" 
      }, { status: 200 });
    }

    // Revoke the specific refresh token
    await revokeRefreshToken(refreshToken);

    const response = NextResponse.json({ 
      message: "Logged out successfully" 
    });

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      message: "Logout failed" 
    }, { status: 500 });
  }
}
