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

/**
 * PUT /api/admin/announcements
 * Admin edits an existing announcement.
 * Body must include: id
 */
export async function PUT(req: Request) {
  const auth = validateUser(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  if (auth.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can edit announcements" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "id is required and must be a string" },
        { status: 400 },
      );
    }

    const title =
      body.title === undefined
        ? undefined
        : typeof body.title === "string"
          ? body.title.trim() || null
          : null;
    const message =
      body.message === undefined
        ? undefined
        : typeof body.message === "string"
          ? body.message.trim()
          : null;
    const link =
      body.link === undefined
        ? undefined
        : typeof body.link === "string"
          ? body.link.trim() || null
          : null;
    const pinned =
      body.pinned === undefined
        ? undefined
        : typeof body.pinned === "boolean"
          ? body.pinned
          : null;

    const updateData: {
      title?: string | null;
      message?: string;
      link?: string | null;
      pinned?: boolean;
    } = {};

    const hasUpdates =
      title !== undefined ||
      message !== undefined ||
      link !== undefined ||
      pinned !== undefined;

    if (!hasUpdates) {
      return NextResponse.json(
        {
          error:
            "At least one field must be provided: title, message, link, pinned",
        },
        { status: 400 },
      );
    }

    // Validate message if provided
    if (message !== undefined) {
      if (message === null || !message) {
        return NextResponse.json(
          { error: "message must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.message = message;
    }

    // Validate title if provided (title can be empty => null)
    if (title !== undefined) {
      if (
        title === null &&
        body.title !== undefined &&
        body.title !== null &&
        typeof body.title !== "string"
      ) {
        return NextResponse.json(
          { error: "title must be a string" },
          { status: 400 },
        );
      }
      updateData.title = title;
    }

    // Validate link if provided
    if (link !== undefined) {
      if (
        link === null &&
        body.link !== undefined &&
        body.link !== null &&
        typeof body.link !== "string"
      ) {
        return NextResponse.json(
          { error: "link must be a string" },
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
      updateData.link = link;
    }

    // Validate pinned if provided
    if (pinned !== undefined) {
      if (pinned === null && body.pinned !== undefined && typeof body.pinned !== "boolean") {
        return NextResponse.json(
          { error: "pinned must be a boolean" },
          { status: 400 },
        );
      }
      updateData.pinned = pinned;
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Announcement updated successfully",
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Edit announcement error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/announcements?id=...
 * Admin deletes an announcement.
 */
export async function DELETE(req: Request) {
  const auth = validateUser(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  if (auth.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can delete announcements" },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json(
      {
        message: "Announcement deleted successfully",
        data: existing,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
