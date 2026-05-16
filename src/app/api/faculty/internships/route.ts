import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { InternshipStatus, Prisma } from "@prisma/client";
import { parseEndDateRangeFromSearchParams } from "@/utils/internshipEndDateQuery";

// GET /api/faculty/internships
// - FACULTY: returns internships where internship.facultyId === current userId
// - ADMIN: returns internships connected to any faculty by default, or a specific faculty via ?facultyId=
// Query: status (all|pending|approved|completed|rejected), facultyId (admin), endDateFrom/endDateTo (YYYY-MM-DD)
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    if (role !== "FACULTY" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only faculty and admin can access faculty internships" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const statusParam = (url.searchParams.get("status") ?? "all").trim();
    const facultyIdParam = (url.searchParams.get("facultyId") ?? "").trim();

    const endRange = parseEndDateRangeFromSearchParams(url.searchParams);
    if (!endRange.ok) {
      return NextResponse.json({ error: endRange.message }, { status: 400 });
    }

    const where: Prisma.InternshipWhereInput = {};

    if (role === "FACULTY") {
      where.facultyId = userId;
    } else {
      // ADMIN
      where.facultyId = facultyIdParam ? facultyIdParam : { not: null };
    }

    if (statusParam !== "all") {
      const normalized = statusParam.toUpperCase();
      const allowed = Object.values(InternshipStatus);
      if (!allowed.includes(normalized as InternshipStatus)) {
        return NextResponse.json(
          {
            error:
              "Invalid status. Allowed: all, " + allowed.map((s) => s.toLowerCase()).join(", "),
          },
          { status: 400 },
        );
      }
      where.status = normalized as InternshipStatus;
    }

    if (endRange.filter) {
      where.endDate = endRange.filter;
    }

    const internships = await prisma.internship.findMany({
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
    });

    return NextResponse.json({
      message: "Faculty internships retrieved successfully",
      data: internships,
    });
  } catch (error) {
    console.error("Get faculty internships error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

