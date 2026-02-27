import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

type EvaluationType = "site_mid" | "site_final";

type CriteriaKeys =
  | "punctualityAttendance"
  | "linkTheoryToPractice"
  | "criticalThinking"
  | "technicalKnowledge"
  | "creativity"
  | "adaptability"
  | "timeManagement"
  | "professionalBehavior"
  | "assignmentsPerformance"
  | "communicationSkills";

type Criteria = Record<CriteriaKeys, number>;

const CRITERIA_KEYS: CriteriaKeys[] = [
  "punctualityAttendance",
  "linkTheoryToPractice",
  "criticalThinking",
  "technicalKnowledge",
  "creativity",
  "adaptability",
  "timeManagement",
  "professionalBehavior",
  "assignmentsPerformance",
  "communicationSkills",
];

function validateRoleAndUser(req: Request) {
  const supervisorId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!supervisorId || !role) {
    return {
      errorResponse: NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      ),
      supervisorId: null,
      role: null,
    };
  }

  if (role !== "SITE_SUPERVISOR") {
    return {
      errorResponse: NextResponse.json(
        { error: "Only site supervisors can submit evaluations" },
        { status: 403 },
      ),
      supervisorId: null,
      role,
    };
  }

  return { errorResponse: null, supervisorId, role };
}

function validateType(type: unknown): type is EvaluationType {
  return type === "site_mid" || type === "site_final";
}

function validateCriteria(criteria: unknown): criteria is Criteria {
  if (!criteria || typeof criteria !== "object") {
    return false;
  }

  for (const key of CRITERIA_KEYS) {
    const value = (criteria as Record<string, unknown>)[key];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return false;
    }
    if (value < 1 || value > 4) {
      return false;
    }
  }

  return true;
}

async function getAndAuthorizeInternshipForSiteSupervisor(
  internshipId: string,
  supervisorId: string,
) {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
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

  if (internship.siteId !== supervisorId) {
    return {
      errorResponse: NextResponse.json(
        { error: "You are not assigned as site supervisor for this internship" },
        { status: 403 },
      ),
      internship: null,
    };
  }

  if (internship.status !== "APPROVED" && internship.status !== "COMPLETED") {
    return {
      errorResponse: NextResponse.json(
        { error: "Evaluations are only allowed for approved or completed internships" },
        { status: 400 },
      ),
      internship: null,
    };
  }

  return { errorResponse: null, internship };
}

async function getAndAuthorizeInternshipForGet(
  internshipId: string,
  userId: string,
  role: string,
) {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
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
  const isStudentOwner = role === "STUDENT" && internship.studentId === userId;
  const isFacultyOwner = role === "FACULTY" && internship.facultyId === userId;
  const isSiteSupervisorOwner =
    role === "SITE_SUPERVISOR" && internship.siteId === userId;

  if (!isAdmin && !isStudentOwner && !isFacultyOwner && !isSiteSupervisorOwner) {
    return {
      errorResponse: NextResponse.json(
        { error: "You are not allowed to view evaluations for this internship" },
        { status: 403 },
      ),
      internship: null,
    };
  }

  return { errorResponse: null, internship };
}

export async function POST(req: Request) {
  try {
    const { errorResponse, supervisorId } = validateRoleAndUser(req);
    if (errorResponse) {
      return errorResponse;
    }
    if (!supervisorId) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { internshipId, type, criteria, comments, totalMarks } = body ?? {};

    if (!internshipId || typeof internshipId !== "string") {
      return NextResponse.json(
        { error: "internshipId is required and must be a string" },
        { status: 400 },
      );
    }

    if (!validateType(type)) {
      return NextResponse.json(
        { error: "type must be either 'site_mid' or 'site_final'" },
        { status: 400 },
      );
    }

    if (!validateCriteria(criteria)) {
      return NextResponse.json(
        {
          error:
            "criteria is required and must contain all 10 fields with integer values between 1 and 4",
        },
        { status: 400 },
      );
    }

    if (typeof totalMarks !== "number" || !Number.isFinite(totalMarks)) {
      return NextResponse.json(
        { error: "totalMarks is required and must be a number" },
        { status: 400 },
      );
    }

    const { errorResponse: internshipError, internship } =
      await getAndAuthorizeInternshipForSiteSupervisor(
        internshipId,
        supervisorId,
      );
    if (internshipError) {
      return internshipError;
    }
    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      );
    }

    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        internshipId,
        evaluatorId: supervisorId,
        type,
      },
    });

    if (existingEvaluation) {
      return NextResponse.json(
        {
          error: "Evaluation of this type has already been submitted for this internship",
        },
        { status: 409 },
      );
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        internshipId,
        evaluatorId: supervisorId,
        type,
        marks: totalMarks,
        comments: comments ?? null,
        // @ts-ignore - details field is added in Prisma schema and will exist after regenerate
        details: criteria,
      },
    });

    return NextResponse.json(
      {
        message: "Evaluation submitted successfully",
        evaluation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Submit site evaluation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

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
    const typeParam = searchParams.get("type");

    if (!internshipId) {
      return NextResponse.json(
        { error: "internshipId query parameter is required" },
        { status: 400 },
      );
    }

    let typeFilter: EvaluationType | undefined;
    if (typeParam) {
      if (!validateType(typeParam)) {
        return NextResponse.json(
          { error: "type must be either 'site_mid' or 'site_final' when provided" },
          { status: 400 },
        );
      }
      typeFilter = typeParam;
    }

    const { errorResponse: internshipError, internship } =
      await getAndAuthorizeInternshipForGet(internshipId, userId, role);
    if (internshipError) {
      return internshipError;
    }
    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found" },
        { status: 404 },
      );
    }

    const evaluations = await prisma.evaluation.findMany({
      where: {
        internshipId,
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: {
        submittedDate: "asc",
      },
    });

    return NextResponse.json(
      {
        message: "Evaluations retrieved successfully",
        evaluations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get site evaluations error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

