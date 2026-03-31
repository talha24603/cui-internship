import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

function validateUser(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      errorResponse: NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      ),
      userId: null,
      role: null,
    };
  }

  return { errorResponse: null, userId, role };
}

/**
 * GET /api/admin/announcements
 * Returns all announcements (pinned first, newest first).
 */
export async function GET(req: Request) {
  const auth = validateUser(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

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
    console.error("Get announcements error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/announcements
 * Admin publishes a new announcement.
 */
export async function POST(req: Request) {
  const auth = validateUser(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  if (auth.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can publish announcements" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const link = typeof body?.link === "string" ? body.link.trim() : "";
    const pinned = Boolean(body?.pinned);

    if (!message) {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    if (link) {
      try {
        new URL(link);
      } catch {
        return NextResponse.json(
          { error: "link must be a valid URL" },
          { status: 400 },
        );
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title || null,
        message,
        link: link || null,
        pinned,
        createdById: auth.userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Announcement published successfully",
        data: announcement,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
