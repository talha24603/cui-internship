import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

const FACULTY_MAX_MARKS = 40;
const SITE_MAX_MARKS = 40;
const OFFICE_MAX_MARKS = 20;
const TOTAL_MAX_MARKS = 100;
const PASS_THRESHOLD = 50;

function getUser(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      userId: null,
      role: null,
      error: NextResponse.json({ error: "User information not found" }, { status: 401 }),
    };
  }

  if (role !== "FACULTY" && role !== "ADMIN") {
    return {
      userId: null,
      role: null,
      error: NextResponse.json(
        { error: "Only faculty supervisors can finalize result" },
        { status: 403 },
      ),
    };
  }

  return { userId, role, error: null };
}

async function getAuthorizedInternship(internshipId: string, userId: string, role: string) {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: {
      student: { select: { id: true, name: true, email: true, regNo: true } },
      faculty: { select: { id: true, name: true, email: true } },
      finalResult: true,
    },
  });

  if (!internship) {
    return {
      internship: null,
      error: NextResponse.json({ error: "Internship not found" }, { status: 404 }),
    };
  }

  const isAdmin = role === "ADMIN";
  const isAssignedFaculty = internship.facultyId === userId;
  if (!isAdmin && !isAssignedFaculty) {
    return {
      internship: null,
      error: NextResponse.json(
        { error: "You are not assigned as faculty supervisor for this internship" },
        { status: 403 },
      ),
    };
  }

  return { internship, error: null };
}

async function getMarksBreakdown(internshipId: string) {
  const [siteFinalEvaluation, facultyEvaluation, officeEvaluation] = await Promise.all([
    prisma.evaluation.findFirst({
      where: { internshipId, type: "site_final" },
      orderBy: { submittedDate: "desc" },
    }),
    prisma.evaluation.findFirst({
      where: { internshipId, type: "faculty" },
      orderBy: { submittedDate: "desc" },
    }),
    prisma.evaluation.findFirst({
      where: { internshipId, type: "office" },
      orderBy: { submittedDate: "desc" },
    }),
  ]);

  const facultyMarksFromForm = facultyEvaluation
    ? Math.round((facultyEvaluation.marks / 60) * FACULTY_MAX_MARKS)
    : null;
  const officeMarksFromForm = officeEvaluation
    ? Math.round((officeEvaluation.marks / 40) * OFFICE_MAX_MARKS)
    : null;

  return {
    facultyMarksFromForm,
    siteMarksFromForm: siteFinalEvaluation?.marks ?? null,
    officeMarksFromForm,
  };
}

export async function GET(req: Request) {
  try {
    const { userId, role, error } = getUser(req);
    if (error) return error;
    if (!userId || !role) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("internshipId");
    if (!internshipId) {
      return NextResponse.json(
        { error: "internshipId query parameter is required" },
        { status: 400 },
      );
    }

    const { internship, error: authError } = await getAuthorizedInternship(
      internshipId,
      userId,
      role,
    );
    if (authError) return authError;
    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const calculated = await getMarksBreakdown(internshipId);
    const finalResultRecord = internship.finalResult as
      | (typeof internship.finalResult & {
          isFinalizedByFaculty?: boolean;
          finalizedAt?: Date | null;
          finalizedById?: string | null;
        })
      | null;
    const facultyMarks = internship.finalResult?.facultyMarks ?? calculated.facultyMarksFromForm;
    const siteMarks = internship.finalResult?.siteMarks ?? calculated.siteMarksFromForm;
    const officeMarks = internship.finalResult?.officeMarks ?? calculated.officeMarksFromForm;
    const totalPreview = (facultyMarks ?? 0) + (siteMarks ?? 0) + (officeMarks ?? 0);
    const statusPreview = totalPreview >= PASS_THRESHOLD ? "pass" : "fail";

    return NextResponse.json(
      {
        message: "Faculty finalization summary retrieved successfully",
        data: {
          internship: {
            id: internship.id,
            status: internship.status,
            student: internship.student,
            faculty: internship.faculty,
          },
          marks: {
            facultyMarks,
            siteMarks,
            officeMarks,
            totalPreview,
            statusPreview,
            maximumMarks: {
              faculty: FACULTY_MAX_MARKS,
              site: SITE_MAX_MARKS,
              office: OFFICE_MAX_MARKS,
              total: TOTAL_MAX_MARKS,
            },
          },
          finalization: {
            isFinalizedByFaculty: finalResultRecord?.isFinalizedByFaculty ?? false,
            finalizedAt: finalResultRecord?.finalizedAt ?? null,
            finalizedById: finalResultRecord?.finalizedById ?? null,
          },
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Get faculty finalization summary error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, role, error } = getUser(req);
    if (error) return error;
    if (!userId || !role) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    const body = await req.json();
    const { internshipId, facultyMarks, siteMarks, officeMarks } = body ?? {};

    if (!internshipId || typeof internshipId !== "string") {
      return NextResponse.json(
        { error: "internshipId is required and must be a string" },
        { status: 400 },
      );
    }

    if (
      typeof facultyMarks !== "number" ||
      !Number.isInteger(facultyMarks) ||
      facultyMarks < 0 ||
      facultyMarks > FACULTY_MAX_MARKS
    ) {
      return NextResponse.json(
        {
          error: `facultyMarks is required and must be an integer between 0 and ${FACULTY_MAX_MARKS}`,
        },
        { status: 400 },
      );
    }

    if (
      typeof siteMarks !== "number" ||
      !Number.isInteger(siteMarks) ||
      siteMarks < 0 ||
      siteMarks > SITE_MAX_MARKS
    ) {
      return NextResponse.json(
        {
          error: `siteMarks is required and must be an integer between 0 and ${SITE_MAX_MARKS}`,
        },
        { status: 400 },
      );
    }

    if (
      typeof officeMarks !== "number" ||
      !Number.isInteger(officeMarks) ||
      officeMarks < 0 ||
      officeMarks > OFFICE_MAX_MARKS
    ) {
      return NextResponse.json(
        {
          error: `officeMarks is required and must be an integer between 0 and ${OFFICE_MAX_MARKS}`,
        },
        { status: 400 },
      );
    }

    const { internship, error: authError } = await getAuthorizedInternship(
      internshipId,
      userId,
      role,
    );
    if (authError) return authError;
    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const totalMarks = facultyMarks + siteMarks + officeMarks;
    const status = totalMarks >= PASS_THRESHOLD ? "pass" : "fail";

    const finalResult = await prisma.finalResult.upsert({
      where: { internshipId },
      create: {
        internshipId,
        facultyMarks,
        siteMarks,
        officeMarks,
        totalMarks,
        status,
        isFinalizedByFaculty: true,
        finalizedAt: new Date(),
        finalizedById: userId,
      } as any,
      update: {
        facultyMarks,
        siteMarks,
        officeMarks,
        totalMarks,
        status,
        isFinalizedByFaculty: true,
        finalizedAt: new Date(),
        finalizedById: userId,
      } as any,
    });
    const finalizedRecord = finalResult as typeof finalResult & {
      isFinalizedByFaculty?: boolean;
      finalizedAt?: Date | null;
      finalizedById?: string | null;
    };

    return NextResponse.json(
      {
        message: "Final result has been finalized by faculty supervisor",
        finalResult: {
          id: finalResult.id,
          internshipId: finalResult.internshipId,
          facultyMarks: finalResult.facultyMarks,
          siteMarks: finalResult.siteMarks,
          officeMarks: finalResult.officeMarks,
          totalMarks: finalResult.totalMarks,
          status: finalResult.status,
          isFinalizedByFaculty: finalizedRecord.isFinalizedByFaculty ?? true,
          finalizedAt: finalizedRecord.finalizedAt ?? null,
          finalizedById: finalizedRecord.finalizedById ?? userId,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Faculty finalization error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
