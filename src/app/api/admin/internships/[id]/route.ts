import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

function validateAdmin(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      errorResponse: NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      ),
    };
  }

  if (role !== "ADMIN") {
    return {
      errorResponse: NextResponse.json(
        { error: "Only admins can access this resource" },
        { status: 403 },
      ),
    };
  }

  return { errorResponse: null };
}

/**
 * GET /api/admin/internships/[id]
 * Returns one internship with related records.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = validateAdmin(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Internship id is required" }, { status: 400 });
  }

  try {
    const internship = await prisma.internship.findUnique({
      where: { id: id.trim() },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
            verified: true,
            createdAt: true,
            InternshipApproval: true,
            InternshipAssignment: true,
            InternshipProposal: true,
          },
        },
        faculty: {
          select: { id: true, name: true, email: true },
        },
        site: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                industry: true,
                address: true,
              },
            },
          },
        },
        reports: {
          orderBy: { submittedDate: "desc" },
        },
        weeklyLogs: {
          orderBy: { weekNo: "asc" },
        },
        evaluations: {
          orderBy: { submittedDate: "desc" },
          include: {
            evaluator: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        finalResult: true,
      },
    });

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Internship retrieved successfully",
      data: internship,
    });
  } catch (error) {
    console.error("Admin get internship error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
