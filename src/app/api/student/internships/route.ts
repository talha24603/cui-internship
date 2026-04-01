import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { InternshipStatus } from "@prisma/client";

/**
 * GET /api/student/internships
 * Returns the authenticated student's internship(s).
 * Optional query: id or internshipId — single record (must belong to student).
 * Optional query: status — filter by PENDING | APPROVED | COMPLETED | REJECTED | all (default all).
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    if (userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can view their internships" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const internshipId = (
      url.searchParams.get("id") ??
      url.searchParams.get("internshipId") ??
      ""
    ).trim();
    const statusParam = (url.searchParams.get("status") ?? "all").trim();

    const where: {
      studentId: string;
      id?: string;
      status?: InternshipStatus;
    } = { studentId: userId };

    if (internshipId) {
      where.id = internshipId;
    }

    if (statusParam !== "all") {
      const normalized = statusParam.toUpperCase();
      const allowed = Object.values(InternshipStatus);
      if (!allowed.includes(normalized as InternshipStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status. Allowed: all, ${allowed.map((s) => s.toLowerCase()).join(", ")}`,
          },
          { status: 400 },
        );
      }
      where.status = normalized as InternshipStatus;
    }

    const internships = await prisma.internship.findMany({
      where,
      include: {
        faculty: { select: { id: true, name: true, email: true } },
        site: {
          select: {
            id: true,
            name: true,
            email: true,
            company: { select: { id: true, name: true, industry: true } },
          },
        },
        finalResult: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (internshipId && internships.length === 0) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Internships retrieved successfully",
      data: internships,
    });
  } catch (error) {
    console.error("Get student internships error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
