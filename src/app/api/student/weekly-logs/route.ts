import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import {
  calculateTotalWeeks,
  calculateCurrentWeek,
  isValidWeekNumber,
  hasInternshipStarted,
  hasInternshipEnded,
} from "@/utils/internship-dates";

// GET /api/student/weekly-logs - Get all weekly logs for student's internship
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    }

    // if (userRole !== "STUDENT" && userRole !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "Only students can access their weekly logs" },
    //     { status: 403 }
    //   );
    // }

    // Find student's internship
    const internship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
      include: {
        weeklyLogs: {
          orderBy: {
            weekNo: "asc",
          },
        },
      },
    });

    if (!internship) {
      return NextResponse.json(
        { error: "No active internship found for this student. Please complete AppEx-B verification first." },
        { status: 404 }
      );
    }

    // Calculate weekly log status
    let weeklyLogStatus = null;
    if (internship.startDate && internship.endDate) {
      const totalWeeks = calculateTotalWeeks(
        internship.startDate,
        internship.endDate
      );
      const currentWeek = calculateCurrentWeek(internship.startDate);
      const submittedWeeks = internship.weeklyLogs.map((log) => log.weekNo);

      weeklyLogStatus = {
        totalWeeks,
        currentWeek,
        submittedWeeks,
        pendingWeeks: Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(
          (week) => !submittedWeeks.includes(week)
        ),
        hasStarted: hasInternshipStarted(internship.startDate),
        hasEnded: hasInternshipEnded(internship.endDate),
      };
    }

    return NextResponse.json({
      message: "Weekly logs retrieved successfully",
      internship: {
        id: internship.id,
        startDate: internship.startDate,
        endDate: internship.endDate,
        status: internship.status,
      },
      weeklyLogs: internship.weeklyLogs,
      weeklyLogStatus,
    });
  } catch (error) {
    console.error("Get weekly logs error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/student/weekly-logs - Submit a weekly log
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    } 

    if (userRole !== "STUDENT" ) {
      return NextResponse.json(
        { error: "Only students can submit weekly logs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { weekNo, activitiesDone, skillsLearned, challenges } = body;

    // Validate required fields
    if (!weekNo || !activitiesDone || !skillsLearned || !challenges) {
      return NextResponse.json(
        {
          error: "Missing required fields: weekNo, activitiesDone, skillsLearned, challenges",
        },
        { status: 400 }
      );
    }

    // Validate weekNo is a positive integer
    const weekNumber = parseInt(weekNo);
    if (isNaN(weekNumber) || weekNumber < 1) {
      return NextResponse.json(
        { error: "Week number must be a positive integer" },
        { status: 400 }
      );
    }

    // Find student's internship
    const internship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
      include: {
        weeklyLogs: {
          select: {
            weekNo: true,
          },
        },
      },
    });

    if (!internship) {
      return NextResponse.json(
        { error: "No active internship found for this student. Please complete AppEx-B verification first." },
        { status: 404 }
      );
    }

    // Check if internship has dates set
    if (!internship.startDate || !internship.endDate) {
      return NextResponse.json(
        {
          error:
            "Internship dates are not set. Please ensure your AppEx-B assignment is verified and dates are provided.",
        },
        { status: 400 }
      );
    }

    // Check if internship has started
    if (!hasInternshipStarted(internship.startDate)) {
      return NextResponse.json(
        { error: "Internship has not started yet" },
        { status: 400 }
      );
    }

    // Validate week number is within valid range
    if (
      !isValidWeekNumber(
        weekNumber,
        internship.startDate,
        internship.endDate
      )
    ) {
      const totalWeeks = calculateTotalWeeks(
        internship.startDate,
        internship.endDate
      );
      return NextResponse.json(
        {
          error: `Week number must be between 1 and ${totalWeeks}`,
          totalWeeks,
        },
        { status: 400 }
      );
    }

    // Check if weekly log for this week already exists
    const existingLog = internship.weeklyLogs.find(
      (log) => log.weekNo === weekNumber
    );

    if (existingLog) {
      return NextResponse.json(
        { error: `Weekly log for week ${weekNumber} already exists` },
        { status: 409 }
      );
    }

    // Create weekly log
    const weeklyLog = await prisma.weeklyLog.create({
      data: {
        internshipId: internship.id,
        weekNo: weekNumber,
        activitiesDone,
        skillsLearned,
        challenges,
      },
    });

    return NextResponse.json(
      {
        message: "Weekly log submitted successfully",
        weeklyLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit weekly log error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

