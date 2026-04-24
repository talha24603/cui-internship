import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/utils/prisma";
import {
  calculateTotalWeeks,
  calculateCurrentWeek,
  hasInternshipStarted,
  hasInternshipEnded,
} from "@/utils/internship-dates";

/**
 * GET /api/faculty/weekly-logs
 * Weekly logs for internships supervised by the authenticated faculty.
 * Admin may optionally pass facultyId to scope results (same pattern as faculty internships).
 * Optional internshipId to return logs for a single supervised internship.
 */
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
        { error: "Only faculty and admin can access faculty weekly logs" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const internshipId = (url.searchParams.get("internshipId") ?? "").trim();
    const facultyIdParam = (url.searchParams.get("facultyId") ?? "").trim();

    const whereInternship: Prisma.InternshipWhereInput = {};

    if (role === "FACULTY") {
      whereInternship.facultyId = userId;
    } else {
      whereInternship.facultyId = facultyIdParam ? facultyIdParam : { not: null };
    }

    if (internshipId) {
      whereInternship.id = internshipId;
    }

    const internships = await prisma.internship.findMany({
      where: whereInternship,
      include: {
        student: {
          select: { id: true, name: true, email: true, regNo: true },
        },
        weeklyLogs: {
          orderBy: { weekNo: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (internshipId && internships.length === 0) {
      return NextResponse.json(
        { error: "Internship not found or not accessible" },
        { status: 404 },
      );
    }

    const data = internships.map((internship) => {
      let weeklyLogStatus: {
        totalWeeks: number;
        currentWeek: number;
        submittedWeeks: number[];
        pendingWeeks: number[];
        hasStarted: boolean;
        hasEnded: boolean;
      } | null = null;

      if (internship.startDate && internship.endDate) {
        const totalWeeks = calculateTotalWeeks(
          internship.startDate,
          internship.endDate,
        );
        const currentWeek = calculateCurrentWeek(internship.startDate);
        const submittedWeeks = internship.weeklyLogs.map((log) => log.weekNo);

        weeklyLogStatus = {
          totalWeeks,
          currentWeek,
          submittedWeeks,
          pendingWeeks: Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(
            (week) => !submittedWeeks.includes(week),
          ),
          hasStarted: hasInternshipStarted(internship.startDate),
          hasEnded: hasInternshipEnded(internship.endDate),
        };
      }

      return {
        internship: {
          id: internship.id,
          type: internship.type,
          status: internship.status,
          startDate: internship.startDate,
          endDate: internship.endDate,
          student: internship.student,
        },
        weeklyLogs: internship.weeklyLogs,
        weeklyLogStatus,
      };
    });

    return NextResponse.json({
      message: "Weekly logs retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Get faculty weekly logs error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
