import { NextResponse } from "next/server";
import { ComplaintStatus } from "@prisma/client";
import prisma from "@/utils/prisma";

const STATUSES: ComplaintStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "DISMISSED",
];

// PATCH /api/admin/complaints/[id]
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update complaints" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, resolutionNotes } = body as {
      status?: string;
      resolutionNotes?: string | null;
    };

    if (status === undefined && resolutionNotes === undefined) {
      return NextResponse.json(
        { error: "Provide at least one of: status, resolutionNotes" },
        { status: 400 }
      );
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    let nextStatus: ComplaintStatus | undefined;
    if (status !== undefined) {
      const upper = String(status).toUpperCase();
      if (!STATUSES.includes(upper as ComplaintStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      nextStatus = upper as ComplaintStatus;
    }

    const data: {
      status?: ComplaintStatus;
      resolutionNotes?: string | null;
      handledById: string;
      handledAt: Date;
    } = {
      handledById: userId,
      handledAt: new Date(),
    };

    if (nextStatus !== undefined) {
      data.status = nextStatus;
    }
    if (resolutionNotes !== undefined) {
      data.resolutionNotes =
        resolutionNotes === null ? null : String(resolutionNotes);
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, regNo: true },
        },
        handledBy: {
          select: { id: true, name: true, email: true },
        },
        internship: {
          select: {
            id: true,
            status: true,
            type: true,
            studentId: true,
            facultyId: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Complaint updated", complaint });
  } catch (error) {
    console.error("Admin complaint PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
