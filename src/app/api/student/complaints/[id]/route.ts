import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/student/complaints/[id]
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can view their complaints" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const complaint = await prisma.complaint.findFirst({
      where: { id, submittedById: userId },
      include: {
        internship: {
          select: { id: true, status: true, type: true },
        },
        handledBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Student complaint GET by id:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
