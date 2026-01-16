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
          facultyVerified: true,
          facultyVerifiedAt: true,
          facultyVerificationComments: true,
          studentVerified: true,
          studentVerifiedAt: true,
          studentVerificationComments: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              regNo: true,
            },
          },
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          site: {
            select: {
              id: true,
              name: true,
              email: true,
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
        facultyVerified: true,
        facultyVerifiedAt: true,
        facultyVerificationComments: true,
        studentVerified: true,
        studentVerifiedAt: true,
        studentVerificationComments: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            email: true,
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
      facultyId,
      siteId,
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

    // Validate and update facultyId if provided
    if (facultyId !== undefined) {
      if (facultyId === null) {
        updateData.facultyId = null;
      } else {
        // Validate that facultyId references a User with role FACULTY
        const facultyUser = await prisma.user.findUnique({
          where: { id: facultyId },
          select: { id: true, role: true },
        });

        if (!facultyUser) {
          return NextResponse.json(
            { error: "facultyId does not reference a valid user" },
            { status: 400 }
          );
        }

        if (facultyUser.role !== "FACULTY") {
          return NextResponse.json(
            { error: "facultyId must reference a user with role FACULTY" },
            { status: 400 }
          );
        }

        updateData.facultyId = facultyId;
      }
    }

    // Validate and update siteId if provided
    if (siteId !== undefined) {
      if (siteId === null) {
        updateData.siteId = null;
      } else {
        // Validate that siteId references a User with role SITE_SUPERVISOR
        const siteUser = await prisma.user.findUnique({
          where: { id: siteId },
          select: { id: true, role: true },
        });

        if (!siteUser) {
          return NextResponse.json(
            { error: "siteId does not reference a valid user" },
            { status: 400 }
          );
        }

        if (siteUser.role !== "SITE_SUPERVISOR") {
          return NextResponse.json(
            { error: "siteId must reference a user with role SITE_SUPERVISOR" },
            { status: 400 }
          );
        }

        updateData.siteId = siteId;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field to update must be provided" },
        { status: 400 }
      );
    }

    const existingAssignment = await prisma.internshipAssignment.findUnique({
      where: { studentId },
      select: {
        id: true,
        companyName: true,
        internshipRole: true,
        facultySupervisorNameDesig: true,
        siteSupervisorNameDesig: true,
        durationWeeks: true,
        startDate: true,
        endDate: true,
        facultyId: true,
        siteId: true,
        status: true,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "AppEx B (Internship Assignment) not found for student" },
        { status: 404 }
      );
    }

    // Check if significant data changes are being made
    // If admin is updating key fields, reset verifications
    const significantFields = [
      "companyName",
      "internshipRole",
      "facultySupervisorNameDesig",
      "siteSupervisorNameDesig",
      "durationWeeks",
      "startDate",
      "endDate",
      "facultyId",
      "siteId",
    ];
    const hasSignificantChanges = significantFields.some(
      (field) => updateData[field] !== undefined
    );

    // If significant changes, reset verification fields and set status to PENDING_VERIFICATION
    if (hasSignificantChanges) {
      updateData.facultyVerified = null;
      updateData.facultyVerifiedAt = null;
      updateData.facultyVerificationComments = null;
      updateData.studentVerified = null;
      updateData.studentVerifiedAt = null;
      updateData.studentVerificationComments = null;
      updateData.status = "PENDING_VERIFICATION";
    } else if (!updateData.status && !existingAssignment.status) {
      // If no status is being set and current status is null, set to PENDING_VERIFICATION
      updateData.status = "PENDING_VERIFICATION";
    }

    const updatedAssignment = await prisma.internshipAssignment.update({
      where: { studentId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

