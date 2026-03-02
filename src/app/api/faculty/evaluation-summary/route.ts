import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

const FACULTY_MAX_MARKS = 40;
const SITE_MAX_MARKS = 40;
const OFFICE_MAX_MARKS = 20;
const TOTAL_MAX_MARKS = 100;
const PASS_THRESHOLD = 50;

function validateFacultyUser(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      errorResponse: NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      ),
      userId: null,
    };
  }

  if (role !== "FACULTY" && role !== "ADMIN") {
    return {
      errorResponse: NextResponse.json(
        { error: "Only faculty supervisors can add evaluation marks" },
        { status: 403 },
      ),
      userId: null,
    };
  }

  return { errorResponse: null, userId };
}

async function getAndAuthorizeInternship(
  internshipId: string,
  facultyId: string,
  role: string,
) {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: {
      finalResult: true,
    },
  });

  if (!internship) {
    return {
      errorResponse: NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      ),
      internship: null,
    };
  }

  const isAdmin = role === "ADMIN";
  const isAssignedFaculty = internship.facultyId === facultyId;

  if (!isAdmin && !isAssignedFaculty) {
    return {
      errorResponse: NextResponse.json(
        {
          error:
            "You are not assigned as faculty supervisor for this internship",
        },
        { status: 403 },
      ),
      internship: null,
    };
  }

  if (internship.status !== "APPROVED" && internship.status !== "COMPLETED") {
    return {
      errorResponse: NextResponse.json(
        {
          error:
            "Evaluation marks can only be added for approved or completed internships",
        },
        { status: 400 },
      ),
      internship: null,
    };
  }

  return { errorResponse: null, internship };
}

/**
 * POST - Faculty supervisor adds/updates their marks (0-40) for the evaluation summary
 */
export async function POST(req: Request) {
  try {
    const { errorResponse, userId } = validateFacultyUser(req);
    if (errorResponse) return errorResponse;
    if (!userId) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { internshipId, marks } = body ?? {};

    if (!internshipId || typeof internshipId !== "string") {
      return NextResponse.json(
        { error: "internshipId is required and must be a string" },
        { status: 400 },
      );
    }

    if (
      typeof marks !== "number" ||
      !Number.isInteger(marks) ||
      marks < 0 ||
      marks > FACULTY_MAX_MARKS
    ) {
      return NextResponse.json(
        {
          error: `marks is required and must be an integer between 0 and ${FACULTY_MAX_MARKS}`,
        },
        { status: 400 },
      );
    }

    const role = req.headers.get("x-user-role") ?? "";
    const { errorResponse: internshipError, internship } =
      await getAndAuthorizeInternship(internshipId, userId, role);
    if (internshipError) return internshipError;
    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      );
    }

    const siteFinalEvaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        type: "site_final",
      },
      orderBy: { submittedDate: "desc" },
    });

    const siteMarks = siteFinalEvaluation?.marks ?? 0;
    const officeMarks = internship.finalResult?.officeMarks ?? 0;
    const totalMarks = marks + siteMarks + officeMarks;
    const status = totalMarks >= PASS_THRESHOLD ? "pass" : "fail";

    const finalResult = await prisma.finalResult.upsert({
      where: { internshipId },
      create: {
        internshipId,
        facultyMarks: marks,
        siteMarks: siteFinalEvaluation ? siteMarks : null,
        officeMarks,
        totalMarks,
        status,
      },
      update: {
        facultyMarks: marks,
        siteMarks: siteFinalEvaluation ? siteMarks : undefined,
        totalMarks,
        status,
      },
    });

    return NextResponse.json(
      {
        message: "Faculty evaluation marks submitted successfully",
        evaluationSummary: {
          facultyMarks: finalResult.facultyMarks,
          siteMarks: finalResult.siteMarks,
          officeMarks: finalResult.officeMarks,
          totalMarks: finalResult.totalMarks,
          status: finalResult.status,
          maximumMarks: {
            faculty: FACULTY_MAX_MARKS,
            site: SITE_MAX_MARKS,
            office: OFFICE_MAX_MARKS,
            total: TOTAL_MAX_MARKS,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Faculty evaluation summary error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * GET - Retrieve evaluation summary for an internship
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("internshipId");

    if (!internshipId) {
      return NextResponse.json(
        { error: "internshipId query parameter is required" },
        { status: 400 },
      );
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: { finalResult: true },
    });

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      );
    }

    const isAdmin = role === "ADMIN";
    const isStudent = role === "STUDENT" && internship.studentId === userId;
    const isFaculty =
      role === "FACULTY" && internship.facultyId === userId;
    const isSiteSupervisor =
      role === "SITE_SUPERVISOR" && internship.siteId === userId;

    if (!isAdmin && !isStudent && !isFaculty && !isSiteSupervisor) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to view the evaluation summary for this internship",
        },
        { status: 403 },
      );
    }

    const siteFinalEvaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        type: "site_final",
      },
      orderBy: { submittedDate: "desc" },
    });

    const summary = {
      facultyMarks: internship.finalResult?.facultyMarks ?? null,
      siteMarks: internship.finalResult?.siteMarks ?? siteFinalEvaluation?.marks ?? null,
      officeMarks: internship.finalResult?.officeMarks ?? null,
      totalMarks: internship.finalResult?.totalMarks ?? null,
      status: internship.finalResult?.status ?? null,
      maximumMarks: {
        faculty: FACULTY_MAX_MARKS,
        site: SITE_MAX_MARKS,
        office: OFFICE_MAX_MARKS,
        total: TOTAL_MAX_MARKS,
      },
    };

    return NextResponse.json(
      {
        message: "Evaluation summary retrieved successfully",
        evaluationSummary: summary,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get evaluation summary error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
