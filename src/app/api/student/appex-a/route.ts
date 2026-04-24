import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/student/appex-a - Get AppEx A for student's internship
export async function GET(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    }

    if (userRole !== "STUDENT" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only students can access their AppEx A" },
        { status: 403 }
      );
    }

    // AppEx A is linked directly with User (student), not Internship
    const appexA = await prisma.internshipApproval.findUnique({
      where: { studentId: userId },
      include: {
        student: {
          select: { id: true, name: true, email: true, regNo: true },
        },
      },
    });

    if (!appexA) {
      return NextResponse.json(
        { error: "AppEx A not found for this student" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "AppEx A retrieved successfully",
      appexA,
    });
  } catch (error) {
    console.error("Get AppEx A error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


// POST /api/student/appex-a - Create/Submit AppEx A
export async function POST(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only students can submit AppEx A" }, { status: 403 });
    }

    const body = await req.json();
    const {
      organization,
      address,
      industrySector,
      contactName,
      contactDesignation,
      contactPhone,
      contactEmail,
      internshipLocation,
      internshipNature,
      mode,
      numberOfInternship,
      startDate,
      endDate,
      workingDays,
      workingHours
    } = body;

    // Validate required fields
    const requiredFields = [
      'organization', 'address', 'industrySector', 'contactName',
      'contactDesignation', 'contactPhone', 'contactEmail',
      'internshipLocation', 'internshipNature', 'mode', 'numberOfInternship', 'startDate', 'endDate',
      'workingDays', 'workingHours'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Check if AppEx A already exists for this student
    const existingAppexA = await prisma.internshipApproval.findUnique({
      where: { studentId: userId }
    });

    if (existingAppexA) {
      return NextResponse.json({
        error: "AppEx A already exists for this internship"
      }, { status: 409 });
    }

    // Validate date format and logic
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        error: "Invalid date format"
      }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({
        error: "Start date must be before end date"
      }, { status: 400 });
    }

    // Create AppEx A linked to the student (User), not Internship
    const appexA = await prisma.internshipApproval.create({
      data: {
        studentId: userId,
        organization,
        address,
        industrySector,
        contactName,
        contactDesignation,
        contactPhone,
        contactEmail,
        internshipNature,
        mode,
        numberOfInternship,
        internshipLocation,
        startDate: start,
        endDate: end,
        workingDays,
        workingHours,
        status: 'pending'
      }
    });

    return NextResponse.json({
      message: "AppEx A submitted successfully",
      appexA
    }, { status: 201 });

  } catch (error) {
    console.error("Create AppEx A error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/student/appex-a - Update AppEx A
export async function PUT(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only students can update their AppEx A" }, { status: 403 });
    }

    const body = await req.json();
    const {
      organization,
      address,
      industrySector,
      contactName,
      contactDesignation,
      contactPhone,
      contactEmail,
      internshipNature,
      mode,
      numberOfInternship,
      internshipLocation,
      startDate,
      endDate,
      workingDays,
      workingHours
    } = body;

    // Find student's AppEx A (linked with User)
    const existingAppexA = await prisma.internshipApproval.findUnique({
      where: { studentId: userId },
    });

    if (!existingAppexA) {
      return NextResponse.json({
        error: "AppEx A not found. Please submit it first."
      }, { status: 404 });
    }

    // Check if AppEx A is already approved/rejected
    if (existingAppexA.status === 'approved') {
      return NextResponse.json({
        error: "Cannot update AppEx A that has been approved"
      }, { status: 403 });
    }

    // Validate dates if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : existingAppexA.startDate;
      const end = endDate ? new Date(endDate) : existingAppexA.endDate;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({
          error: "Invalid date format"
        }, { status: 400 });
      }

      if (start >= end) {
        return NextResponse.json({
          error: "Start date must be before end date"
        }, { status: 400 });
      }
    }

    // Update AppEx A (by student)
    const updatedAppexA = await prisma.internshipApproval.update({
      where: { studentId: userId },
      data: {
        organization: organization ?? existingAppexA.organization,
        address: address ?? existingAppexA.address,
        industrySector: industrySector ?? existingAppexA.industrySector,
        contactName: contactName ?? existingAppexA.contactName,
        contactDesignation: contactDesignation ?? existingAppexA.contactDesignation,
        contactPhone: contactPhone ?? existingAppexA.contactPhone,
        contactEmail: contactEmail ?? existingAppexA.contactEmail,
        internshipNature: internshipNature ?? existingAppexA.internshipNature,
        mode: mode ?? existingAppexA.mode,
        numberOfInternship: numberOfInternship ?? existingAppexA.numberOfInternship,
        internshipLocation: internshipLocation ?? existingAppexA.internshipLocation,
        startDate: startDate ? new Date(startDate) : existingAppexA.startDate,
        endDate: endDate ? new Date(endDate) : existingAppexA.endDate,
        workingDays: workingDays ?? existingAppexA.workingDays,
        workingHours: workingHours ?? existingAppexA.workingHours,
        status: 'pending'
      }
    });

    return NextResponse.json({
      message: "AppEx A updated successfully",
      appexA: updatedAppexA
    });

  } catch (error) {
    console.error("Update AppEx A error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
