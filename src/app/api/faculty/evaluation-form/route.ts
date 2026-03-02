import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

type FacultyCriteriaKeys =
  | "platformActivityEngagement"
  | "completionOfInternshipProjects"
  | "earningsAchieved"
  | "skillDevelopmentLearning"
  | "clientRatingAndFeedback"
  | "professionalismCommunication";

type FacultyCriteria = Record<FacultyCriteriaKeys, number>;

const FACULTY_CRITERIA_KEYS: FacultyCriteriaKeys[] = [
  "platformActivityEngagement",
  "completionOfInternshipProjects",
  "earningsAchieved",
  "skillDevelopmentLearning",
  "clientRatingAndFeedback",
  "professionalismCommunication",
];

const FACULTY_CRITERIA_LABELS: Record<FacultyCriteriaKeys, string> = {
  platformActivityEngagement: "Platform Activity & Engagement",
  completionOfInternshipProjects: "Completion of Internship Project(s)",
  earningsAchieved: "Earnings Achieved",
  skillDevelopmentLearning: "Skill Development & Learning",
  clientRatingAndFeedback: "Client Rating and Feedback",
  professionalismCommunication: "Professionalism & Communication",
};

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const TOTAL_MAX = FACULTY_CRITERIA_KEYS.length * SCORE_MAX; // 60

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
        { error: "Only faculty supervisors can submit the evaluation form" },
        { status: 403 },
      ),
      userId: null,
    };
  }

  return { errorResponse: null, userId };
}

function validateCriteria(criteria: unknown): criteria is FacultyCriteria {
  if (!criteria || typeof criteria !== "object") {
    return false;
  }

  for (const key of FACULTY_CRITERIA_KEYS) {
    const value = (criteria as Record<string, unknown>)[key];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return false;
    }
    if (value < SCORE_MIN || value > SCORE_MAX) {
      return false;
    }
  }

  return true;
}

async function getAndAuthorizeInternship(
  internshipId: string,
  facultyId: string,
  role: string,
) {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: { finalResult: true },
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
            "Evaluation form can only be submitted for approved or completed internships",
        },
        { status: 400 },
      ),
      internship: null,
    };
  }

  return { errorResponse: null, internship };
}

/**
 * POST - Faculty supervisor submits the evaluation form (6 criteria, each 1-10)
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
          error: `criteria is required and must contain all 6 fields with integer values between ${SCORE_MIN} and ${SCORE_MAX}: ${FACULTY_CRITERIA_KEYS.join(", ")}`,
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

    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        evaluatorId: userId,
        type: "faculty",
      },
    });

    if (existingEvaluation) {
      return NextResponse.json(
        {
          error:
            "Faculty evaluation form has already been submitted for this internship",
        },
        { status: 409 },
      );
    }

    const totalMarks = FACULTY_CRITERIA_KEYS.reduce(
      (sum, key) => sum + (criteria as FacultyCriteria)[key],
      0,
    );

    const evaluation = await prisma.evaluation.create({
      data: {
        internshipId,
        evaluatorId: userId,
        type: "faculty",
        marks: totalMarks,
        comments: comments ?? null,
        details: criteria,
      },
    });

    // Scale to 40 for FinalResult (faculty max in evaluation summary) and update
    const facultyMarksScaled = Math.round((totalMarks / TOTAL_MAX) * 40);
    const siteFinalEvaluation = await prisma.evaluation.findFirst({
      where: { internshipId, type: "site_final" },
      orderBy: { submittedDate: "desc" },
    });
    const siteMarks = siteFinalEvaluation?.marks ?? 0;
    const officeMarks = internship.finalResult?.officeMarks ?? 0;
    const finalTotalMarks = facultyMarksScaled + siteMarks + officeMarks;
    const status = finalTotalMarks >= 50 ? "pass" : "fail";

    await prisma.finalResult.upsert({
      where: { internshipId },
      create: {
        internshipId,
        facultyMarks: facultyMarksScaled,
        siteMarks: siteFinalEvaluation ? siteMarks : null,
        officeMarks,
        totalMarks: finalTotalMarks,
        status,
      },
      update: {
        facultyMarks: facultyMarksScaled,
        siteMarks: siteFinalEvaluation ? siteMarks : undefined,
        totalMarks: finalTotalMarks,
        status,
      },
    });

    const criteriaWithLabels = FACULTY_CRITERIA_KEYS.map((key) => ({
      criterion: FACULTY_CRITERIA_LABELS[key],
      key,
      score: (criteria as FacultyCriteria)[key],
      maxScore: SCORE_MAX,
    }));

    return NextResponse.json(
      {
        message: "Faculty evaluation form submitted successfully",
        evaluation: {
          id: evaluation.id,
          type: evaluation.type,
          totalMarks,
          maxMarks: TOTAL_MAX,
          facultyMarksScaled,
          criteria: criteriaWithLabels,
          comments: evaluation.comments,
          submittedDate: evaluation.submittedDate,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Faculty evaluation form error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * GET - Retrieve faculty evaluation form for an internship
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
            "You are not allowed to view the faculty evaluation for this internship",
        },
        { status: 403 },
      );
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        type: "faculty",
      },
      orderBy: { submittedDate: "desc" },
      include: { evaluator: { select: { id: true, name: true, email: true } } },
    });

    if (!evaluation) {
      return NextResponse.json(
        {
          message: "No faculty evaluation form submitted yet",
          evaluation: null,
        },
        { status: 200 },
      );
    }

    const details = evaluation.details as FacultyCriteria | null;
    const criteriaWithLabels = details
      ? FACULTY_CRITERIA_KEYS.map((key) => ({
          criterion: FACULTY_CRITERIA_LABELS[key],
          key,
          score: details[key],
          maxScore: SCORE_MAX,
        }))
      : [];

    return NextResponse.json(
      {
        message: "Faculty evaluation form retrieved successfully",
        evaluation: {
          id: evaluation.id,
          type: evaluation.type,
          totalMarks: evaluation.marks,
          maxMarks: TOTAL_MAX,
          criteria: criteriaWithLabels,
          comments: evaluation.comments,
          submittedDate: evaluation.submittedDate,
          evaluator: evaluation.evaluator,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get faculty evaluation form error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
