import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

/**
 * GET /api/faculty/internships/[id]
 * Returns one internship with related records for assigned faculty.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
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
        { error: "Only faculty and admin can access this resource" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Internship id is required" }, { status: 400 });
    }

    const internship = await prisma.internship.findFirst({
      where: role === "ADMIN" ? { id: id.trim() } : { id: id.trim(), facultyId: userId },
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
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                industry: true,
                address: true,
              },
            },
          },
        },
        reports: {
          orderBy: { submittedDate: "desc" },
        },
        weeklyLogs: {
          orderBy: { weekNo: "asc" },
        },
        evaluations: {
          orderBy: { submittedDate: "desc" },
          include: {
            evaluator: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        finalResult: true,
      },
    });

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found or not accessible" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Internship retrieved successfully",
      data: internship,
    });
  } catch (error) {
    console.error("Faculty get internship detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
