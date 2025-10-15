import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
