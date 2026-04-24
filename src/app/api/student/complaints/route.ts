import { NextResponse } from "next/server";
import { ComplaintCategory, ComplaintStatus } from "@prisma/client";
import prisma from "@/utils/prisma";

const STATUSES: ComplaintStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "DISMISSED",
];

const CATEGORIES: ComplaintCategory[] = [
  "GENERAL",
  "INTERNSHIP_SITE",
  "FACULTY",
  "PLACEMENT_OFFICE",
  "OTHER",
];

function isCategory(v: unknown): v is ComplaintCategory {
  return typeof v === "string" && CATEGORIES.includes(v as ComplaintCategory);
}

// POST /api/student/complaints
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit complaints" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { subject, body: textBody, category, internshipId } = body as {
      subject?: string;
      body?: string;
      category?: string;
      internshipId?: string | null;
    };

    if (!subject?.trim() || !textBody?.trim()) {
      return NextResponse.json(
        { error: "subject and body are required" },
        { status: 400 }
      );
    }

    let internshipIdResolved: string | null = null;
    if (internshipId != null && internshipId !== "") {
      const internship = await prisma.internship.findFirst({
        where: { id: internshipId, studentId: userId },
      });
      if (!internship) {
        return NextResponse.json(
          { error: "Internship not found or not owned by you" },
          { status: 404 }
        );
      }
      internshipIdResolved = internship.id;
    }

    const categoryValue: ComplaintCategory =
      category != null && isCategory(category) ? category : "GENERAL";

    const complaint = await prisma.complaint.create({
      data: {
        subject: subject.trim(),
        body: textBody.trim(),
        category: categoryValue,
        submittedById: userId,
        internshipId: internshipIdResolved,
      },
      include: {
        internship: {
          select: {
            id: true,
            status: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Complaint submitted", complaint },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student complaint POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/student/complaints
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can view their complaints" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const where: { submittedById: string; status?: ComplaintStatus } = {
      submittedById: userId,
    };
    if (
      statusParam &&
      STATUSES.includes(statusParam.toUpperCase() as ComplaintStatus)
    ) {
      where.status = statusParam.toUpperCase() as ComplaintStatus;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        internship: {
          select: { id: true, status: true, type: true },
        },
        handledBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("Student complaint GET list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
