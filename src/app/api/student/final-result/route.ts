import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

/**
 * GET /api/student/final-result
 * Returns final result for the authenticated student.
 * Optional query param: internshipId
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
        { error: "Only students can view final result" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("internshipId")?.trim();

    const whereClause = internshipId
      ? { id: internshipId, studentId: userId }
      : { studentId: userId };

    const internship = await prisma.internship.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        finalResult: true,
        faculty: { select: { id: true, name: true, email: true } },
        site: { select: { id: true, name: true, email: true } },
      },
    });

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found for this student" },
        { status: 404 },
      );
    }

    if (!internship.finalResult) {
      return NextResponse.json(
        {
          message: "Final result is not available yet",
          finalResult: null,
          internship: {
            id: internship.id,
            type: internship.type,
            status: internship.status,
            startDate: internship.startDate,
            endDate: internship.endDate,
            faculty: internship.faculty,
            site: internship.site,
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        message: "Final result retrieved successfully",
        finalResult: internship.finalResult,
        internship: {
          id: internship.id,
          type: internship.type,
          status: internship.status,
          startDate: internship.startDate,
          endDate: internship.endDate,
          faculty: internship.faculty,
          site: internship.site,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get student final result error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
