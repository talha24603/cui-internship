import { NextResponse } from "next/server";
import { signAccessToken, signRefreshToken } from "@/utils/authhelper";

export async function GET() {
  try {
    // Test JWT token generation
    const testPayload = { sub: "test-user-id", role: "STUDENT", name: "Test User", email: "test@example.com" };
    
    const accessToken = signAccessToken(testPayload);
    const refreshToken = signRefreshToken({ sub: "test-user-id" });
    
    return NextResponse.json({
      status: "success",
      message: "JWT token generation successful",
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Auth test failed:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "JWT token generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
