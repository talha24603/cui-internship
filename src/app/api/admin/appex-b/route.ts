import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

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

