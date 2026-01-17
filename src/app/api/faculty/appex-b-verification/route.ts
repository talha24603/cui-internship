import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// Helper function to calculate overall status based on verification states
function calculateStatus(
  facultyVerified: boolean | null,
  studentVerified: boolean | null
): string {
  // If either party requested changes, status is CHANGES_REQUESTED
  if (facultyVerified === false || studentVerified === false) {
    return "CHANGES_REQUESTED";
  }

  // If both approved, status is BOTH_VERIFIED
  if (facultyVerified === true && studentVerified === true) {
    return "BOTH_VERIFIED";
  }

  // If only faculty approved
  if (facultyVerified === true && studentVerified !== true) {
    return "FACULTY_VERIFIED";
  }

  // If only student approved
  if (studentVerified === true && facultyVerified !== true) {
    return "STUDENT_VERIFIED";
  }

  // Default to pending verification
  return "PENDING_VERIFICATION";
}

// GET /api/faculty/appex-b-verification - Get all AppEx B assignments assigned to faculty supervisor
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

    if (userRole !== "FACULTY" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only faculty can access AppEx B verifications" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // Optional status filter

    // Build where clause - only assignments assigned to this faculty
    const whereClause: any = {
      facultyId: userId,
    };

    // If status filter is provided, filter by calculated status
    // Note: This is a simplified filter - in production, you might want to filter in memory
    // or add a computed field in the database
    if (status && status !== "all") {
      // For status filtering, we need to check verification states
      if (status === "PENDING_VERIFICATION") {
        whereClause.OR = [
          { facultyVerified: null },
          { studentVerified: null },
        ];
      } else if (status === "FACULTY_VERIFIED") {
        whereClause.facultyVerified = true;
        whereClause.studentVerified = { not: true };
      } else if (status === "STUDENT_VERIFIED") {
        whereClause.studentVerified = true;
        whereClause.facultyVerified = { not: true };
      } else if (status === "BOTH_VERIFIED") {
        whereClause.facultyVerified = true;
        whereClause.studentVerified = true;
      } else if (status === "CHANGES_REQUESTED") {
        whereClause.OR = [
          { facultyVerified: false },
          { studentVerified: false },
        ];
      }
    }

    const assignments = await prisma.internshipAssignment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
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
      orderBy: { id: "desc" },
    });

    // Calculate status for each assignment
    const assignmentsWithStatus = assignments.map((assignment) => ({
      ...assignment,
      calculatedStatus: calculateStatus(
        assignment.facultyVerified,
        assignment.studentVerified
      ),
    }));

    return NextResponse.json({
      message: "AppEx B assignments retrieved successfully",
      data: assignmentsWithStatus,
    });
  } catch (error) {
    console.error("Get AppEx B verifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/faculty/appex-b-verification - Verify AppEx B (approve or request changes)
export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    }

    if (userRole !== "FACULTY" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only faculty can verify AppEx B" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assignmentId, action, comments } = body;

    if (!assignmentId || !action) {
      return NextResponse.json(
        {
          error: "assignmentId and action are required",
        },
        { status: 400 }
      );
    }

    if (!["approve", "request_changes"].includes(action)) {
      return NextResponse.json(
        {
          error: "action must be either 'approve' or 'request_changes'",
        },
        { status: 400 }
      );
    }

    // Find the assignment and verify it's assigned to this faculty
    const assignment = await prisma.internshipAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "AppEx B assignment not found" },
        { status: 404 }
      );
    }

    // Verify that this assignment is assigned to the current faculty
    if (assignment.facultyId !== userId) {
      return NextResponse.json(
        {
          error: "You are not assigned as the faculty supervisor for this assignment",
        },
        { status: 403 }
      );
    }

    // Determine verification value: true for approve, false for request_changes
    const verified = action === "approve";

    // Update faculty verification fields
    const updatedAssignment = await prisma.internshipAssignment.update({
      where: { id: assignmentId },
      data: {
        facultyVerified: verified,
        facultyVerifiedAt: new Date(),
        facultyVerificationComments: comments || null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
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

    // Calculate new status
    const newStatus = calculateStatus(
      updatedAssignment.facultyVerified,
      updatedAssignment.studentVerified
    );

    // Update the status field
    await prisma.internshipAssignment.update({
      where: { id: assignmentId },
      data: { status: newStatus },
    });

    // If AppEx B is fully verified by both parties, link supervisors to internship
    if (newStatus === "BOTH_VERIFIED") {
      // Find the student's internship
      const internship = await prisma.internship.findFirst({
        where: {
          studentId: updatedAssignment.studentId,
        },
      });

      if (internship) {
        // Prepare update data - only include fields that are present in AppEx B
        const internshipUpdateData: {
          facultyId?: string | null;
          siteId?: string | null;
          internshipAssignmentId: string;
        } = {
          internshipAssignmentId: assignmentId,
        };

        // Only update facultyId if it exists in AppEx B
        if (updatedAssignment.facultyId !== null && updatedAssignment.facultyId !== undefined) {
          internshipUpdateData.facultyId = updatedAssignment.facultyId;
        }

        // Only update siteId if it exists in AppEx B
        if (updatedAssignment.siteId !== null && updatedAssignment.siteId !== undefined) {
          internshipUpdateData.siteId = updatedAssignment.siteId;
        }

        // Update internship with supervisors from AppEx B
        await prisma.internship.update({
          where: { id: internship.id },
          data: internshipUpdateData,
        });
      }
    }

    return NextResponse.json({
      message: `AppEx B ${action === "approve" ? "approved" : "changes requested"} successfully`,
      data: {
        ...updatedAssignment,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error("Verify AppEx B error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
