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

    // if (userRole !== "STUDENT") {
    //   return NextResponse.json(
    //     { error: "Only students can submit AppEx B" },
    //     { status: 403 }
    //   );
    // }

    const body = await req.json();
    const {
      name,
      degreeProgram,
      email,
      semester,
      contactNo,
      preferredField,
      agreementAccepted,
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

    // Use upsert to create or update InternshipAssignment
    const internshipAssignment = await prisma.internshipAssignment.upsert({
      where: { studentId: userId }, // unique field to check if record exists
      update: {
        name,
        degreeProgram,
        email,
        semester,
        contactNo,
        preferredField,
        agreementAccepted,
      },
      create: {
        studentId: userId,
        name,
        degreeProgram,
        email,
        semester,
        contactNo,
        preferredField,
        agreementAccepted,
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
