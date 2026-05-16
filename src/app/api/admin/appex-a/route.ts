import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { buildAdminPagination, parseAdminPagination } from "@/utils/adminPagination";
import { InternshipApprovalStatus, InternshipStatus, InternshipType, Prisma } from "@prisma/client";

function appexAAdminQueryStatus(raw: string | null): InternshipApprovalStatus | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase().trim();
  if (s === "pending") return InternshipApprovalStatus.PENDING;
  if (s === "approved") return InternshipApprovalStatus.APPROVED;
  if (s === "rejected") return InternshipApprovalStatus.REJECTED;
  return undefined;
}

function appexAAdminPatchStatus(raw: string): InternshipApprovalStatus | null {
  const s = raw.toLowerCase().trim();
  if (s === "approved") return InternshipApprovalStatus.APPROVED;
  if (s === "rejected") return InternshipApprovalStatus.REJECTED;
  return null;
}

function resolveInternshipType(mode: string): InternshipType {
  const normalizedMode = mode.trim().toLowerCase();
  if (normalizedMode.includes("fiverr") || normalizedMode.includes("freelance")) {
    return InternshipType.FIVERR;
  }
  if (normalizedMode.includes("remote")) {
    return InternshipType.REMOTE;
  }
  return InternshipType.ONSITE;
}

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
    const filterStatus = appexAAdminQueryStatus(url.searchParams.get("status"));
    const regNoRaw = url.searchParams.get("regNo")?.trim() ?? "";
    const { skip, take, page, pageSize } = parseAdminPagination(url.searchParams);

    const where: Prisma.InternshipApprovalWhereInput = {};

    if (filterStatus) {
      where.status = filterStatus;
    }
    if (regNoRaw) {
      where.student = {
        regNo: { contains: regNoRaw, mode: "insensitive" },
      };
    }

    const [appexASubmissions, total] = await Promise.all([
      prisma.internshipApproval.findMany({
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
        skip,
        take,
      }),
      prisma.internshipApproval.count({ where }),
    ]);

    return NextResponse.json({
      message: "AppEx A submissions retrieved successfully",
      data: appexASubmissions,
      pagination: buildAdminPagination(page, pageSize, total),
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

    const nextStatus = appexAAdminPatchStatus(status);
    if (!nextStatus) {
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
      data: { status: nextStatus },
    });

    const resolvedType = resolveInternshipType(appexA.mode);
    const internship = appexA.internshipId
      ? await prisma.internship.findUnique({
          where: { id: appexA.internshipId },
          select: { id: true },
        })
      : await prisma.internship.findFirst({
          where: {
            studentId: appexA.student.id,
            status: { in: [InternshipStatus.PENDING, InternshipStatus.APPROVED] },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

    // If approved, ensure internship exists and sync approval metadata
    if (nextStatus === InternshipApprovalStatus.APPROVED) {
      if (internship) {
        // Update internship with dates from AppEx A
        await prisma.internship.update({
          where: { id: internship.id },
          data: {
            type: resolvedType,
            startDate: appexA.startDate,
            endDate: appexA.endDate,
            status: InternshipStatus.PENDING,
          },
        });
      } else {
        const created = await prisma.internship.create({
          data: {
            studentId: appexA.student.id,
            type: resolvedType,
            startDate: appexA.startDate,
            endDate: appexA.endDate,
            status: InternshipStatus.PENDING,
          },
        });
        await prisma.internshipApproval.update({
          where: { id: appexA.id },
          data: { internshipId: created.id },
        });
      }
    }

    if (nextStatus === InternshipApprovalStatus.REJECTED && internship) {
      await prisma.internship.update({
        where: { id: internship.id },
        data: {
          type: resolvedType,
          status: InternshipStatus.REJECTED,
        },
      });
    }

    if (nextStatus === InternshipApprovalStatus.REJECTED && !internship) {
      const created = await prisma.internship.create({
        data: {
          studentId: appexA.student.id,
          type: resolvedType,
          status: InternshipStatus.REJECTED,
        },
      });
      await prisma.internshipApproval.update({
        where: { id: appexA.id },
        data: { internshipId: created.id },
      });
    }

    return NextResponse.json({
      message: `AppEx A ${nextStatus.toLowerCase()} successfully`,
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
