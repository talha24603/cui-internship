import { NextResponse } from "next/server";
import { InternshipStatus } from "@prisma/client";
import prisma from "@/utils/prisma";
import { buildAdminPagination, parseAdminPagination } from "@/utils/adminPagination";

function parseInternshipListStatus(raw: string | null): InternshipStatus | undefined {
  if (!raw) return undefined;
  const u = raw.trim().toUpperCase();
  return (Object.values(InternshipStatus) as string[]).includes(u)
    ? (u as InternshipStatus)
    : undefined;
}

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
 * Query: page, pageSize (or limit). Max pageSize 100.
 * Optional: status=PENDING|APPROVED|COMPLETED|REJECTED
 */
export async function GET(req: Request) {
  const auth = validateAdmin(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const url = new URL(req.url);
    const { skip, take, page, pageSize } = parseAdminPagination(url.searchParams);
    const statusFilter = parseInternshipListStatus(url.searchParams.get("status"));
    const where = statusFilter ? { status: statusFilter } : {};

    const [internships, total] = await Promise.all([
      prisma.internship.findMany({
        where,
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
        skip,
        take,
      }),
      prisma.internship.count({ where }),
    ]);

    return NextResponse.json({
      message: "Internships retrieved successfully",
      data: internships,
      pagination: buildAdminPagination(page, pageSize, total),
    });
  } catch (error) {
    console.error("Admin list internships error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
