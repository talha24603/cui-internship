import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// POST /api/student/appex-b - Create or Update AppEx B using upsert
export async function POST(req: Request) {
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

    if (userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit AppEx B" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      degreeProgram,
      email,
      semester,
      contactNo,
      preferredField,
      agreementAccepted,
      facultyId,
      siteId,
    } = body;

    // Validate required fields
    const requiredFields = [
      "name",
      "degreeProgram",
      "email",
      "semester",
      "contactNo",
      "preferredField",
      "agreementAccepted",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          {
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate agreementAccepted is a boolean
    if (typeof agreementAccepted !== "boolean") {
      return NextResponse.json(
        { error: "agreementAccepted must be a boolean" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate facultyId if provided
    if (facultyId !== undefined && facultyId !== null) {
      const facultyUser = await prisma.user.findUnique({
        where: { id: facultyId },
        select: { id: true, role: true },
      });

      if (!facultyUser) {
        return NextResponse.json(
          { error: "facultyId does not reference a valid user" },
          { status: 400 }
        );
      }

      if (facultyUser.role !== "FACULTY") {
        return NextResponse.json(
          { error: "facultyId must reference a user with role FACULTY" },
          { status: 400 }
        );
      }
    }

    // Validate siteId if provided
    if (siteId !== undefined && siteId !== null) {
      const siteUser = await prisma.user.findUnique({
        where: { id: siteId },
        select: { id: true, role: true },
      });

      if (!siteUser) {
        return NextResponse.json(
          { error: "siteId does not reference a valid user" },
          { status: 400 }
        );
      }

      if (siteUser.role !== "SITE_SUPERVISOR") {
        return NextResponse.json(
          { error: "siteId must reference a user with role SITE_SUPERVISOR" },
          { status: 400 }
        );
      }
    }

    // Prepare update/create data
    const assignmentData: any = {
      name,
      degreeProgram,
      email,
      semester,
      contactNo,
      preferredField,
      agreementAccepted,
    };

    // Add supervisor IDs if provided
    if (facultyId !== undefined) {
      assignmentData.facultyId = facultyId;
    }
    if (siteId !== undefined) {
      assignmentData.siteId = siteId;
    }

    // Use upsert to create or update InternshipAssignment
    const internshipAssignment = await prisma.internshipAssignment.upsert({
      where: { studentId: userId }, // unique field to check if record exists
      update: assignmentData,
      create: {
        studentId: userId,
        adminApprovalStatus: "PENDING",
        ...assignmentData,
      },
    });

    return NextResponse.json(
      {
        message: "AppEx B saved successfully",
        internshipAssignment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Create/Update AppEx B error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
