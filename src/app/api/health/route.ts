import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test basic functionality
    const healthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.5.0"
    };

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
