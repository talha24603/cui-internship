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

// GET /api/student/appex-b-verification - Get student's AppEx B assignment for verification
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

    if (userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can access their AppEx B verification" },
        { status: 403 }
      );
    }

    // Get the student's assignment
    const assignment = await prisma.internshipAssignment.findUnique({
      where: { studentId: userId },
      include: {
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

    if (!assignment) {
      return NextResponse.json(
        { error: "AppEx B assignment not found" },
        { status: 404 }
      );
    }

    // Calculate status
    const calculatedStatus = calculateStatus(
      assignment.facultyVerified,
      assignment.studentVerified
    );

    return NextResponse.json({
      message: "AppEx B assignment retrieved successfully",
      data: {
        ...assignment,
        status: calculatedStatus,
      },
    });
  } catch (error) {
    console.error("Get AppEx B verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/student/appex-b-verification - Verify AppEx B (approve or request changes)
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

    if (userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can verify their AppEx B" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, comments } = body;

    if (!action) {
      return NextResponse.json(
        {
          error: "action is required",
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

    // Find the student's assignment
    const assignment = await prisma.internshipAssignment.findUnique({
      where: { studentId: userId },
      include: {
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

    if (!assignment) {
      return NextResponse.json(
        { error: "AppEx B assignment not found" },
        { status: 404 }
      );
    }

    // Determine verification value: true for approve, false for request_changes
    const verified = action === "approve";

    // Update student verification fields
    const updatedAssignment = await prisma.internshipAssignment.update({
      where: { studentId: userId },
      data: {
        studentVerified: verified,
        studentVerifiedAt: new Date(),
        studentVerificationComments: comments || null,
      },
      include: {
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

    // Calculate new status
    const newStatus = calculateStatus(
      updatedAssignment.facultyVerified,
      updatedAssignment.studentVerified
    );

    // Update the status field
    await prisma.internshipAssignment.update({
      where: { studentId: userId },
      data: { status: newStatus },
    });

    // If AppEx B is fully verified by both parties, link supervisors to internship
    if (newStatus === "BOTH_VERIFIED") {
      // Find the student's internship
      const internship = await prisma.internship.findFirst({
        where: {
          studentId: userId,
        },
      });

      if (internship) {
        // Prepare update data - only include fields that are present in AppEx B
        const internshipUpdateData: {
          facultyId?: string | null;
          siteId?: string | null;
          internshipAssignmentId: string;
        } = {
          internshipAssignmentId: updatedAssignment.id,
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
