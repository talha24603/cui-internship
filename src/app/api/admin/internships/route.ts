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
 * GET /api/admin/internships
 * Returns all internships (no pagination).
 */
export async function GET(req: Request) {
  const auth = validateAdmin(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const internships = await prisma.internship.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true, regNo: true },
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
              select: { id: true, name: true, industry: true },
            },
          },
        },
        finalResult: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Internships retrieved successfully",
      data: internships,
    });
  } catch (error) {
    console.error("Admin list internships error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
