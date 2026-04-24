import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

/**
 * GET /api/announcements
 * Public announcements feed (pinned first, newest first).
 */
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: "Announcements retrieved successfully",
      data: announcements,
    });
  } catch (error) {
    console.error("Get public announcements error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
