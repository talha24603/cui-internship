import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

type OfficeCriteriaKeys =
  | "internshipReport"
  | "portfolioEvidence"
  | "timeManagement"
  | "overallInternshipImpact";

type OfficeCriteria = Record<OfficeCriteriaKeys, number>;

const OFFICE_CRITERIA_KEYS: OfficeCriteriaKeys[] = [
  "internshipReport",
  "portfolioEvidence",
  "timeManagement",
  "overallInternshipImpact",
];

const OFFICE_CRITERIA_LABELS: Record<OfficeCriteriaKeys, string> = {
  internshipReport: "Internship Report (Logbook)",
  portfolioEvidence: "Portfolio Evidence (Screenshots, Files, Chat Logs)",
  timeManagement: "Time Management & Deadline Compliance",
  overallInternshipImpact: "Overall Internship Impact",
};

// Each criterion: Excellent (10), Good (8), Satisfactory (5), Needs Improvement (3)
const ALLOWED_SCORES = [3, 5, 8, 10] as const;
const OFFICE_FORM_MAX = OFFICE_CRITERIA_KEYS.length * 10; // 40
const OFFICE_EVALUATION_SUMMARY_MAX = 20; // scaled for FinalResult
const PASS_THRESHOLD = 50;

function validateAdminUser(req: Request) {
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

  if (role !== "ADMIN") {
    return {
      errorResponse: NextResponse.json(
        { error: "Only admins can submit the office evaluation form" },
        { status: 403 },
      ),
      userId: null,
    };
  }

  return { errorResponse: null, userId };
}

function validateCriteria(criteria: unknown): criteria is OfficeCriteria {
  if (!criteria || typeof criteria !== "object") {
    return false;
  }

  for (const key of OFFICE_CRITERIA_KEYS) {
    const value = (criteria as Record<string, unknown>)[key];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return false;
    }
    if (!ALLOWED_SCORES.includes(value as (typeof ALLOWED_SCORES)[number])) {
      return false;
    }
  }

  return true;
}

/**
 * POST - Admin submits the office evaluation form (4 criteria, each 3/5/8/10)
 */
export async function POST(req: Request) {
  try {
    const { errorResponse, userId } = validateAdminUser(req);
    if (errorResponse) return errorResponse;
    if (!userId) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { internshipId, criteria, comments } = body ?? {};

    if (!internshipId || typeof internshipId !== "string") {
      return NextResponse.json(
        { error: "internshipId is required and must be a string" },
        { status: 400 },
      );
    }

    if (!validateCriteria(criteria)) {
      return NextResponse.json(
        {
          error: `criteria is required and must contain all 4 fields. Each criterion must be one of: ${ALLOWED_SCORES.join(", ")} (Excellent=10, Good=8, Satisfactory=5, Needs Improvement=3). Keys: ${OFFICE_CRITERIA_KEYS.join(", ")}`,
        },
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

    if (internship.status !== "APPROVED" && internship.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Office evaluation can only be submitted for approved or completed internships",
        },
        { status: 400 },
      );
    }

    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        type: "office",
      },
    });

    if (existingEvaluation) {
      return NextResponse.json(
        {
          error:
            "Office evaluation has already been submitted for this internship",
        },
        { status: 409 },
      );
    }

    const totalMarks = OFFICE_CRITERIA_KEYS.reduce(
      (sum, key) => sum + (criteria as OfficeCriteria)[key],
      0,
    );

    const evaluation = await prisma.evaluation.create({
      data: {
        internshipId,
        evaluatorId: userId,
        type: "office",
        marks: totalMarks,
        comments: comments ?? null,
        details: criteria,
      },
    });

    // Scale to 20 for FinalResult (office max in evaluation summary)
    const officeMarksScaled = Math.round(
      (totalMarks / OFFICE_FORM_MAX) * OFFICE_EVALUATION_SUMMARY_MAX,
    );

    const siteFinalEvaluation = await prisma.evaluation.findFirst({
      where: { internshipId, type: "site_final" },
      orderBy: { submittedDate: "desc" },
    });
    const facultyEvaluation = await prisma.evaluation.findFirst({
      where: { internshipId, type: "faculty" },
      orderBy: { submittedDate: "desc" },
    });
    const facultyMarksFromSummary = internship.finalResult?.facultyMarks ?? 0;
    const facultyMarks =
      facultyMarksFromSummary > 0
        ? facultyMarksFromSummary
        : facultyEvaluation
          ? Math.round((facultyEvaluation.marks / 60) * 40)
          : 0;
    const siteMarks = siteFinalEvaluation?.marks ?? 0;
    const totalMarksFinal = facultyMarks + siteMarks + officeMarksScaled;
    const status = totalMarksFinal >= PASS_THRESHOLD ? "pass" : "fail";

    await prisma.finalResult.upsert({
      where: { internshipId },
      create: {
        internshipId,
        facultyMarks: facultyMarks || 0,
        siteMarks: siteFinalEvaluation ? siteMarks : null,
        officeMarks: officeMarksScaled,
        totalMarks: totalMarksFinal,
        status,
        isFinalizedByFaculty: false,
        finalizedAt: null,
        finalizedById: null,
      },
      update: {
        officeMarks: officeMarksScaled,
        totalMarks: totalMarksFinal,
        status,
        isFinalizedByFaculty: false,
        finalizedAt: null,
        finalizedById: null,
      },
    });

    const criteriaWithLabels = OFFICE_CRITERIA_KEYS.map((key) => ({
      criterion: OFFICE_CRITERIA_LABELS[key],
      key,
      score: (criteria as OfficeCriteria)[key],
      maxScore: 10,
    }));

    return NextResponse.json(
      {
        message: "Office evaluation form submitted successfully",
        evaluation: {
          id: evaluation.id,
          type: evaluation.type,
          totalMarks,
          maxMarks: OFFICE_FORM_MAX,
          officeMarksScaled,
          criteria: criteriaWithLabels,
          comments: evaluation.comments,
          submittedDate: evaluation.submittedDate,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Office evaluation form error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * GET - Retrieve office evaluation form for an internship
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
    });

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      );
    }

    const isAdmin = role === "ADMIN";
    const isStudent = role === "STUDENT" && internship.studentId === userId;
    const isFaculty = role === "FACULTY" && internship.facultyId === userId;
    const isSiteSupervisor =
      role === "SITE_SUPERVISOR" && internship.siteId === userId;

    if (!isAdmin && !isStudent && !isFaculty && !isSiteSupervisor) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to view the office evaluation for this internship",
        },
        { status: 403 },
      );
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        type: "office",
      },
      orderBy: { submittedDate: "desc" },
      include: { evaluator: { select: { id: true, name: true, email: true } } },
    });

    if (!evaluation) {
      return NextResponse.json(
        {
          message: "No office evaluation form submitted yet",
          evaluation: null,
        },
        { status: 200 },
      );
    }

    const details = evaluation.details as OfficeCriteria | null;
    const criteriaWithLabels = details
      ? OFFICE_CRITERIA_KEYS.map((key) => ({
          criterion: OFFICE_CRITERIA_LABELS[key],
          key,
          score: details[key],
          maxScore: 10,
        }))
      : [];

    return NextResponse.json(
      {
        message: "Office evaluation form retrieved successfully",
        evaluation: {
          id: evaluation.id,
          type: evaluation.type,
          totalMarks: evaluation.marks,
          maxMarks: OFFICE_FORM_MAX,
          criteria: criteriaWithLabels,
          comments: evaluation.comments,
          submittedDate: evaluation.submittedDate,
          evaluator: evaluation.evaluator,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get office evaluation form error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
