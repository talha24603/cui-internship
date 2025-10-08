import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/faculty/appex-a-approval/{id} - Get specific AppEx A submission details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'FACULTY' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only faculty and admin can access AppEx A details" }, { status: 403 });
    }

    const appexA = await prisma.internshipApproval.findUnique({
      where: { id: params.id },
      include: {
        internship: {
          include: {
            student: {
              select: { id: true, name: true, email: true, regNo: true }
            }
          }
        }
      }
    });

    if (!appexA) {
      return NextResponse.json({ error: "AppEx A submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "AppEx A details retrieved successfully",
      appexA
    });

  } catch (error) {
    console.error("Get specific AppEx A error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
