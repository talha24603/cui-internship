import { NextResponse } from "next/server";
import { runTokenCleanup } from "@/utils/tokenCleanup";

export async function GET() {
  try {
    const result = await runTokenCleanup();
    
    return NextResponse.json({
      success: true,
      message: "Token cleanup completed successfully",
      deletedCount: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Token cleanup cron job failed:", error);
    
    return NextResponse.json({
      success: false,
      message: "Token cleanup failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
