import { NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, getValidRefreshToken } from "@/utils/authhelper";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const refreshToken = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("refreshToken="))
      ?.split("=")[1]; 

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token not provided" }, { status: 401 });
    }

    // Verify token signature and expiration
    const payload = verifyRefreshToken(refreshToken);
    
    // Check if token exists and is valid in database
    const storedToken = await getValidRefreshToken(refreshToken);
    if (!storedToken) {
      return NextResponse.json({ 
        message: "Invalid or expired refresh token" 
      }, { status: 401 });
    }

    // Generate new access token with user role
    const newAccessToken = signAccessToken({ 
      sub: payload.sub,
      role: storedToken.user.role,
      name: storedToken.user.name,
      email: storedToken.user.email
    });

    return NextResponse.json({ 
      accessToken: newAccessToken,
      message: "Token refreshed successfully"
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ 
      message: "Invalid refresh token" 
    }, { status: 401 });
  }
}
