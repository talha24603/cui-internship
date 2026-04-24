import { NextResponse } from "next/server";
import { ComplaintStatus, Prisma } from "@prisma/client";
import prisma from "@/utils/prisma";

const STATUSES: ComplaintStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "DISMISSED",
];

// GET /api/faculty/complaints — internships supervised by this faculty only
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "FACULTY") {
      return NextResponse.json(
        { error: "Only faculty can view these complaints" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: Prisma.ComplaintWhereInput = {
      internship: { facultyId: userId },
    };

    if (status && STATUSES.includes(status.toUpperCase() as ComplaintStatus)) {
      where.status = status.toUpperCase() as ComplaintStatus;
    }

    if (search?.trim()) {
      where.OR = [
        { subject: { contains: search.trim(), mode: "insensitive" } },
        { body: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [complaints, total, stats] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true, regNo: true },
          },
          handledBy: {
            select: { id: true, name: true, email: true },
          },
          internship: {
            select: {
              id: true,
              status: true,
              type: true,
              studentId: true,
              facultyId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
      prisma.complaint.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
    ]);

    const statusCounts: Record<ComplaintStatus, number> = {
      OPEN: 0,
      IN_REVIEW: 0,
      RESOLVED: 0,
      DISMISSED: 0,
    };
    for (const row of stats) {
      statusCounts[row.status] = row._count;
    }

    return NextResponse.json({
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: statusCounts,
    });
  } catch (error) {
    console.error("Faculty complaints GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
