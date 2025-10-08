import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/student/appex-a - Get AppEx A for student's internship
export async function GET(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only students can access their AppEx A" }, { status: 403 });
    }

    // Find student's internship with AppEx A
    const internship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: { in: ['PENDING', 'APPROVED'] }
      },
      include: {
        approvals: true,
        student: {
          select: { id: true, name: true, email: true, regNo: true }
        }
      }
    });

    if (!internship) {
      return NextResponse.json({ error: "No active internship found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "AppEx A retrieved successfully",
      internship: {
        id: internship.id,
        type: internship.type,
        status: internship.status,
        student: internship.student,
        appexA: internship.approvals
      }
    });

  } catch (error) {
    console.error("Get AppEx A error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
      internshipField,
      internshipLocation,
      startDate,
      endDate,
      workingDays,
      workingHours
    } = body;

    // Validate required fields
    const requiredFields = [
      'organization', 'address', 'industrySector', 'contactName',
      'contactDesignation', 'contactPhone', 'contactEmail',
      'internshipField', 'internshipLocation', 'startDate', 'endDate',
      'workingDays', 'workingHours'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }

    // Find student's internship
    const internship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: 'PENDING'
      }
    });

    if (!internship) {
      return NextResponse.json({ 
        error: "No pending internship found. Please create an internship first." 
      }, { status: 404 });
    }

    // Check if AppEx A already exists
    const existingAppexA = await prisma.internshipApproval.findUnique({
      where: { internshipId: internship.id }
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

    // Create AppEx A
    const appexA = await prisma.internshipApproval.create({
      data: {
        internshipId: internship.id,
        organization,
        address,
        industrySector,
        contactName,
        contactDesignation,
        contactPhone,
        contactEmail,
        internshipField,
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
      internshipField,
      internshipLocation,
      startDate,
      endDate,
      workingDays,
      workingHours
    } = body;

    // Find student's internship with AppEx A
    const internship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: 'PENDING'
      },
      include: {
        approvals: true
      }
    });

    if (!internship) {
      return NextResponse.json({ 
        error: "No pending internship found" 
      }, { status: 404 });
    }

    if (!internship.approvals) {
      return NextResponse.json({ 
        error: "AppEx A not found. Please submit it first." 
      }, { status: 404 });
    }

    // Check if AppEx A is already approved/rejected
    if (internship.approvals.status !== 'pending') {
      return NextResponse.json({ 
        error: "Cannot update AppEx A that has been approved or rejected" 
      }, { status: 403 });
    }

    // Validate dates if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : internship.approvals.startDate;
      const end = endDate ? new Date(endDate) : internship.approvals.endDate;
      
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

    // Update AppEx A
    const updatedAppexA = await prisma.internshipApproval.update({
      where: { internshipId: internship.id },
      data: {
        organization: organization ?? internship.approvals.organization,
        address: address ?? internship.approvals.address,
        industrySector: industrySector ?? internship.approvals.industrySector,
        contactName: contactName ?? internship.approvals.contactName,
        contactDesignation: contactDesignation ?? internship.approvals.contactDesignation,
        contactPhone: contactPhone ?? internship.approvals.contactPhone,
        contactEmail: contactEmail ?? internship.approvals.contactEmail,
        internshipField: internshipField ?? internship.approvals.internshipField,
        internshipLocation: internshipLocation ?? internship.approvals.internshipLocation,
        startDate: startDate ? new Date(startDate) : internship.approvals.startDate,
        endDate: endDate ? new Date(endDate) : internship.approvals.endDate,
        workingDays: workingDays ?? internship.approvals.workingDays,
        workingHours: workingHours ?? internship.approvals.workingHours,
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
