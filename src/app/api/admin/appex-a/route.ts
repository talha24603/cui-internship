import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/admin/appex-a - Get all AppEx A submissions (Admin only)
export async function GET(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can view AppEx A submissions" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // pending/approved/rejected

    const where: any = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status;
    }

    

    const appexASubmissions = await prisma.internshipApproval.findMany({
      where,
      select: {
        id: true,
        organization: true,
        address: true,
        industrySector: true,
        contactName: true,
        contactDesignation: true,
        contactPhone: true,
        contactEmail: true,
        internshipNature: true,
        internshipLocation: true,
        mode: true,
        numberOfInternship: true,
        startDate: true,
        endDate: true,
        workingDays: true,
        workingHours: true,
        status: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({
      message: "AppEx A submissions retrieved successfully",
      data: appexASubmissions,
    });
  } catch (error) {
    console.error("Admin get AppEx A error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/appex-a - Approve/Reject AppEx A (Admin only)
export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can approve or reject AppEx A" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { appexAId, status } = body;

    if (!appexAId || !status) {
      return NextResponse.json(
        { error: "AppEx A ID and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const appexA = await prisma.internshipApproval.findUnique({
      where: { id: appexAId },
      include: {
        student: {
          select: { id: true, name: true, email: true, regNo: true },
        },
      },
    });

    if (!appexA) {
      return NextResponse.json(
        { error: "AppEx A submission not found" },
        { status: 404 }
      );
    }

    // if (appexA.status !== "pending") {
    //   return NextResponse.json(
    //     {
    //       error: "AppEx A has already been processed",
    //       currentStatus: appexA.status,
    //     },
    //     { status: 409 }
    //   );
    // }

    const updatedAppexA = await prisma.internshipApproval.update({
      where: { id: appexAId },
      data: { status },
    });

    // If approved, update the internship with start and end dates
    if (status === 'approved') {
      // Find the student's internship
      const internship = await prisma.internship.findFirst({
        where: {
          studentId: appexA.student.id,
        },
      });

      if (internship) {
        // Update internship with dates from AppEx A
        await prisma.internship.update({
          where: { id: internship.id },
          data: {
            startDate: appexA.startDate,
            endDate: appexA.endDate,
            status: 'APPROVED',
            internshipApprovalId: appexA.id,
          },
        });
      }
    }

    return NextResponse.json({
      message: `AppEx A ${status} successfully`,
      appexA: updatedAppexA,
      student: appexA.student,
      processedBy: userId,
    });
  } catch (error) {
    console.error("Admin approve/reject AppEx A error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


