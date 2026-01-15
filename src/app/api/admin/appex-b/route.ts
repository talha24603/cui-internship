import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/admin/appex-b - Get all AppEx B (InternshipAssignment) submissions (Admin only)
// GET /api/admin/appex-b?id=xxx - Get a specific AppEx B by ID (Admin only)
export async function GET(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can view AppEx B submissions" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id"); // Optional ID to get specific appex-b
    const status = url.searchParams.get("status"); // Optional status filter

    // If ID is provided, return specific appex-b
    if (id) {
      const internshipAssignment = await prisma.internshipAssignment.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          degreeProgram: true,
          email: true,
          semester: true,
          contactNo: true,
          preferredField: true,
          companyName: true,
          internshipRole: true,
          facultySupervisorNameDesig: true,
          siteSupervisorNameDesig: true,
          durationWeeks: true,
          startDate: true,
          endDate: true,
          agreementAccepted: true,
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
      });

      if (!internshipAssignment) {
        return NextResponse.json(
          { error: "AppEx B not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "AppEx B retrieved successfully",
        data: internshipAssignment,
      });
    }

    // Otherwise, return all appex-b submissions
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const internshipAssignments = await prisma.internshipAssignment.findMany({
      where,
      select: {
        id: true,
        name: true,
        degreeProgram: true,
        email: true,
        semester: true,
        contactNo: true,
        preferredField: true,
        agreementAccepted: true,
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
        id: "desc",
      },
    });

    return NextResponse.json({
      message: "AppEx B submissions retrieved successfully",
      data: internshipAssignments,
    });
  } catch (error) {
    console.error("Admin get AppEx B error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/appex-b - Update AppEx B extended details (Admin only)
export async function PATCH(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update AppEx B records" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      studentId,
      companyName,
      internshipRole,
      facultySupervisorNameDesig,
      siteSupervisorNameDesig,
      durationWeeks,
      startDate,
      endDate,
    } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (companyName !== undefined) updateData.companyName = companyName;
    if (internshipRole !== undefined) updateData.internshipRole = internshipRole;
    if (facultySupervisorNameDesig !== undefined)
      updateData.facultySupervisorNameDesig = facultySupervisorNameDesig;
    if (siteSupervisorNameDesig !== undefined)
      updateData.siteSupervisorNameDesig = siteSupervisorNameDesig;
    if (durationWeeks !== undefined) {
      if (typeof durationWeeks !== "number" || Number.isNaN(durationWeeks)) {
        return NextResponse.json(
          { error: "durationWeeks must be a number" },
          { status: 400 }
        );
      }
      updateData.durationWeeks = durationWeeks;
    }
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field to update must be provided" },
        { status: 400 }
      );
    }

    const existingAssignment = await prisma.internshipAssignment.findUnique({
      where: { studentId },
      select: { id: true },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "AppEx B (Internship Assignment) not found for student" },
        { status: 404 }
      );
    }

    const updatedAssignment = await prisma.internshipAssignment.update({
      where: { studentId },
      data: updateData,
    });

    return NextResponse.json({
      message: "AppEx B updated successfully",
      internshipAssignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Admin update AppEx B error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

