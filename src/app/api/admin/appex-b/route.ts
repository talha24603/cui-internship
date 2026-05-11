import { NextResponse } from "next/server";
import { InternshipAssignmentStatus } from "@prisma/client";
import prisma from "@/utils/prisma";
import { buildAdminPagination, parseAdminPagination } from "@/utils/adminPagination";

function normalizeDateInput(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`).toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

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
    const adminApprovalStatus = url.searchParams.get("adminApprovalStatus"); // Optional admin approval filter

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
          adminApprovalStatus: true,
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

    if (adminApprovalStatus) {
      where.adminApprovalStatus = adminApprovalStatus;
    }

    const { skip, take, page, pageSize } = parseAdminPagination(url.searchParams);

    const [internshipAssignments, total] = await Promise.all([
      prisma.internshipAssignment.findMany({
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
          adminApprovalStatus: true,
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
        skip,
        take,
      }),
      prisma.internshipAssignment.count({ where }),
    ]);

    return NextResponse.json({
      message: "AppEx B submissions retrieved successfully",
      data: internshipAssignments,
      pagination: buildAdminPagination(page, pageSize, total),
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
      id: assignmentId,
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
      adminApprovalAction,
    } = body;

    if (!assignmentId && !studentId) {
      return NextResponse.json(
        { error: "Either id (assignment id) or studentId is required" },
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
    if (startDate !== undefined) {
      const normalizedStartDate = normalizeDateInput(startDate);
      if (normalizedStartDate === undefined) {
        return NextResponse.json(
          { error: "startDate must be a valid date or ISO-8601 datetime" },
          { status: 400 }
        );
      }
      updateData.startDate = normalizedStartDate;
    }
    if (endDate !== undefined) {
      const normalizedEndDate = normalizeDateInput(endDate);
      if (normalizedEndDate === undefined) {
        return NextResponse.json(
          { error: "endDate must be a valid date or ISO-8601 datetime" },
          { status: 400 }
        );
      }
      updateData.endDate = normalizedEndDate;
    }

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

    const existingAssignment = assignmentId
      ? await prisma.internshipAssignment.findUnique({
          where: { id: assignmentId },
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
            adminApprovalStatus: true,
          },
        })
      : await prisma.internshipAssignment.findFirst({
          where: { studentId },
          orderBy: { id: "desc" },
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
            adminApprovalStatus: true,
          },
        });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "AppEx B (Internship Assignment) not found" },
        { status: 404 }
      );
    }

    // Check if significant data changes are being made
    // If admin is updating key fields, reset verifications.
    // IMPORTANT: only count a field as "changed" when its new value actually
    // differs from the stored value. The admin UI pre-fills these fields with
    // existing values and always submits them, so a plain `!== undefined` check
    // would treat an unchanged approval click as a significant change and would
    // incorrectly reset the workflow status and verifications.
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

    const valuesDiffer = (next: unknown, current: unknown): boolean => {
      if (next === current) return false;
      if (next == null && current == null) return false;
      if (next == null || current == null) return true;
      if (current instanceof Date) {
        const currentIso = current.toISOString();
        if (typeof next === "string") return currentIso !== next;
        if (next instanceof Date) return current.getTime() !== next.getTime();
        return true;
      }
      return next !== current;
    };

    const existingAssignmentRecord = existingAssignment as unknown as Record<string, unknown>;
    const hasSignificantChanges = significantFields.some((field) => {
      if (updateData[field] === undefined) return false;
      return valuesDiffer(updateData[field], existingAssignmentRecord[field]);
    });

    // If significant changes, reset verification fields and set status to PENDING_VERIFICATION
    if (hasSignificantChanges) {
      updateData.facultyVerified = null;
      updateData.facultyVerifiedAt = null;
      updateData.facultyVerificationComments = null;
      updateData.studentVerified = null;
      updateData.studentVerifiedAt = null;
      updateData.studentVerificationComments = null;
      updateData.status = InternshipAssignmentStatus.PENDING_VERIFICATION;
    }

    // Handle admin approval status if provided
    if (adminApprovalAction) {
      if (!["approve", "reject", "reset"].includes(adminApprovalAction)) {
        return NextResponse.json(
          {
            error:
              "adminApprovalAction must be one of 'approve', 'reject', or 'reset'",
          },
          { status: 400 }
        );
      }

      if (adminApprovalAction === "approve") {
        updateData.adminApprovalStatus = "APPROVED";
      } else if (adminApprovalAction === "reject") {
        updateData.adminApprovalStatus = "REJECTED";
      } else if (adminApprovalAction === "reset") {
        updateData.adminApprovalStatus = "PENDING";
      }
    }

    const updatedAssignment = await prisma.internshipAssignment.update({
      where: { id: existingAssignment.id },
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

