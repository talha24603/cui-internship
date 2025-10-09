import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/faculty/appex-a-approval - Get all pending AppEx A submissions (Faculty/Admin only)
export async function GET(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'FACULTY' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only faculty and admin can access AppEx A approvals" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get AppEx A submissions with filters
    const whereClause: any = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    const [appexASubmissions, total] = await Promise.all([
      prisma.internshipApproval.findMany({
        where: whereClause,
        include: {
          internship: {
            include: {
              student: {
                select: { id: true, name: true, email: true, regNo: true }
              }
            }
          }
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit
      }),
      prisma.internshipApproval.count({ where: whereClause })
    ]);

    return NextResponse.json({
      message: "AppEx A submissions retrieved successfully",
      data: appexASubmissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get AppEx A approvals error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/faculty/appex-a-approval - Approve/Reject AppEx A submission
export async function PATCH(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'FACULTY' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only faculty and admin can approve/reject AppEx A" }, { status: 403 });
    }

    const body = await req.json();
    const { appexAId, status, comments } = body;

    if (!appexAId || !status) {
      return NextResponse.json({ 
        error: "AppEx A ID and status are required" 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be either 'approved' or 'rejected'" 
      }, { status: 400 });
    }

    // Find the AppEx A submission
    const appexA = await prisma.internshipApproval.findUnique({
      where: { id: appexAId },
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

    if (appexA.status !== 'pending') {
      return NextResponse.json({ 
        error: "AppEx A has already been processed" 
      }, { status: 409 });
    }

    // Update AppEx A status
    const updatedAppexA = await prisma.internshipApproval.update({
      where: { id: appexAId },
      data: { status }
    });

    // If approved, update the internship with start and end dates
    if (status === 'approved') {
      await prisma.internship.update({
        where: { id: appexA.internshipId },
        data: {
          status: 'APPROVED',
          startDate: appexA.startDate,
          endDate: appexA.endDate
        }
      });
    }

    // Log the approval/rejection (you might want to create a separate table for this)
    console.log(`${userRole} ${userId} ${status} AppEx A for student ${appexA.internship.student.name} (${appexA.internship.student.regNo}). Comments: ${comments || 'None'}`);

    return NextResponse.json({
      message: `AppEx A ${status} successfully`,
      appexA: updatedAppexA,
      internship: {
        id: appexA.internship.id,
        student: appexA.internship.student,
        status: status === 'approved' ? 'APPROVED' : 'PENDING'
      }
    });

  } catch (error) {
    console.error("Approve/Reject AppEx A error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

