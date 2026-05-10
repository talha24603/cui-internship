// import { NextResponse } from "next/server";
// import prisma from "@/utils/prisma";
// import { InternshipStatus } from "@prisma/client";

// // POST /api/student/appex-b - Create or Update AppEx B using upsert
// export async function POST(req: Request) {
//   try {
//     // Get user info from middleware headers (already verified)
//     const userId = req.headers.get("x-user-id");
//     const userRole = req.headers.get("x-user-role");

//     if (!userId || !userRole) {
//       return NextResponse.json(
//         { error: "User information not found" },
//         { status: 401 }
//       );
//     }

//     if (userRole !== "STUDENT") {
//       return NextResponse.json(
//         { error: "Only students can submit AppEx B" },
//         { status: 403 }
//       );
//     }

//     const body = await req.json();
//     const {
//       name,
//       degreeProgram,
//       email,
//       semester,
//       contactNo,
//       preferredField,
//       agreementAccepted,
//       facultyId,
//       siteId,
//     } = body;

//     // Validate required fields
//     const requiredFields = [
//       "name",
//       "degreeProgram",
//       "email",
//       "semester",
//       "contactNo",
//       "preferredField",
//       "agreementAccepted",
//     ];

//     for (const field of requiredFields) {
//       if (body[field] === undefined || body[field] === null) {
//         return NextResponse.json(
//           {
//             error: `Missing required field: ${field}`,
//           },
//           { status: 400 }
//         );
//       }
//     }

//     // Validate agreementAccepted is a boolean
//     if (typeof agreementAccepted !== "boolean") {
//       return NextResponse.json(
//         { error: "agreementAccepted must be a boolean" },
//         { status: 400 }
//       );
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
//     }

//     // Validate facultyId if provided
//     if (facultyId !== undefined && facultyId !== null) {
//       const facultyUser = await prisma.user.findUnique({
//         where: { id: facultyId },
//         select: { id: true, role: true },
//       });

//       if (!facultyUser) {
//         return NextResponse.json(
//           { error: "facultyId does not reference a valid user" },
//           { status: 400 }
//         );
//       }

//       if (facultyUser.role !== "FACULTY") {
//         return NextResponse.json(
//           { error: "facultyId must reference a user with role FACULTY" },
//           { status: 400 }
//         );
//       }
//     }

//     // Validate siteId if provided
//     if (siteId !== undefined && siteId !== null) {
//       const siteUser = await prisma.user.findUnique({
//         where: { id: siteId },
//         select: { id: true, role: true },
//       });

//       if (!siteUser) {
//         return NextResponse.json(
//           { error: "siteId does not reference a valid user" },
//           { status: 400 }
//         );
//       }

//       if (siteUser.role !== "SITE_SUPERVISOR") {
//         return NextResponse.json(
//           { error: "siteId must reference a user with role SITE_SUPERVISOR" },
//           { status: 400 }
//         );
//       }
//     }

//     const activeInternship = await prisma.internship.findFirst({
//       where: {
//         studentId: userId,
//         status: { in: [InternshipStatus.PENDING, InternshipStatus.APPROVED] },
//       },
//       orderBy: { createdAt: "desc" },
//       select: { id: true },
//     });

//     if (!activeInternship) {
//       return NextResponse.json(
//         { error: "No active internship attempt found. Please submit AppEx A first." },
//         { status: 400 }
//       );
//     }

//     // Prepare update/create data
//     const assignmentData: any = {
//       name,
//       degreeProgram,
//       email,
//       semester,
//       contactNo,
//       preferredField,
//       agreementAccepted,
//     };

//     // Add supervisor IDs if provided
//     if (facultyId !== undefined) {
//       assignmentData.facultyId = facultyId;
//     }
//     if (siteId !== undefined) {
//       assignmentData.siteId = siteId;
//     }

//     const existingAssignment = await prisma.internshipAssignment.findFirst({
//       where: { internshipId: activeInternship.id },
//       select: { id: true },
//     });

//     // Create or update InternshipAssignment for current internship attempt
//     let internshipAssignment;
//     if (existingAssignment) {
//       internshipAssignment = await prisma.internshipAssignment.update({
//         where: { id: existingAssignment.id },
//         data: assignmentData,
//       });
//     } else {
//       internshipAssignment = await prisma.internshipAssignment.create({
//         data: {
//           studentId: userId,
//           internshipId: activeInternship.id,
//           adminApprovalStatus: "PENDING",
//           ...assignmentData,
//         },
//       });
//     }

//     await prisma.internship.update({
//       where: { id: activeInternship.id },
//       data: { internshipAssignmentId: internshipAssignment.id },
//     });

//     return NextResponse.json(
//       {
//         message: "AppEx B saved successfully",
//         internshipAssignment,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Create/Update AppEx B error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import {
  AdminApprovalStatus,
  InternshipAssignmentStatus,
  InternshipStatus,
} from "@prisma/client";

/* ------------------ Validation ------------------ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const SEMESTER_REGEX = /^([1-9]|1[0-2])$/; // 1..12

type AppexBInput = {
  name?: unknown;
  degreeProgram?: unknown;
  email?: unknown;
  semester?: unknown;
  contactNo?: unknown;
  preferredField?: unknown;
  agreementAccepted?: unknown;
};

function isStr(v: unknown, min: number, max: number): v is string {
  return typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
}

function validateAppexB(
  data: AppexBInput
): { ok: true } | { ok: false; error: string } {
  if (!isStr(data.name, 2, 100)) {
    return { ok: false, error: "name must be 2-100 characters" };
  }
  if (!isStr(data.degreeProgram, 2, 100)) {
    return { ok: false, error: "degreeProgram must be 2-100 characters" };
  }
  if (typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim())) {
    return { ok: false, error: "email is not a valid email address" };
  }
  if (
    typeof data.semester !== "string" ||
    !SEMESTER_REGEX.test(data.semester.trim())
  ) {
    return { ok: false, error: "semester must be a number between 1 and 12" };
  }
  if (typeof data.contactNo !== "string" || !PHONE_REGEX.test(data.contactNo.trim())) {
    return { ok: false, error: "contactNo is not a valid phone number" };
  }
  if (!isStr(data.preferredField, 2, 100)) {
    return { ok: false, error: "preferredField must be 2-100 characters" };
  }
  if (data.agreementAccepted !== true) {
    return { ok: false, error: "You must accept the agreement to proceed" };
  }
  return { ok: true };
}

// POST /api/student/appex-b
// Create or Update AppEx B
export async function POST(req: Request) {
  try {
    // Get authenticated user from middleware headers
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    }

    // Only students can submit
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

    const validation = validateAppexB(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate faculty if provided
    if (facultyId) {
      const faculty = await prisma.user.findUnique({
        where: { id: facultyId },
        select: {
          id: true,
          role: true,
        },
      });

      if (!faculty) {
        return NextResponse.json(
          { error: "Invalid facultyId" },
          { status: 400 }
        );
      }

      if (faculty.role !== "FACULTY") {
        return NextResponse.json(
          { error: "facultyId must belong to FACULTY" },
          { status: 400 }
        );
      }
    }

    // Validate site if provided
    if (siteId) {
      const site = await prisma.user.findUnique({
        where: { id: siteId },
        select: {
          id: true,
          role: true,
        },
      });

      if (!site) {
        return NextResponse.json(
          { error: "Invalid siteId" },
          { status: 400 }
        );
      }

      if (site.role !== "SITE_SUPERVISOR") {
        return NextResponse.json(
          { error: "siteId must belong to SITE_SUPERVISOR" },
          { status: 400 }
        );
      }
    }

    // Find active internship (AppEx A already submitted)
    const activeInternship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: {
          in: [
            InternshipStatus.PENDING,
            InternshipStatus.APPROVED,
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!activeInternship) {
      return NextResponse.json(
        {
          error:
            "No active internship found. Submit AppEx A first.",
        },
        { status: 400 }
      );
    }

    // Upsert AppEx B using internshipId (one-to-one relation)
    const internshipAssignment =
      await prisma.internshipAssignment.upsert({
        where: {
          internshipId: activeInternship.id,
        },
        update: {
          name,
          degreeProgram,
          email,
          semester,
          contactNo,
          preferredField,
          agreementAccepted,
          facultyId: facultyId || null,
          siteId: siteId || null,

          // Reset approval when student updates
          adminApprovalStatus: AdminApprovalStatus.PENDING,

          // Reset student verification fields if needed
          studentVerified: false,
          studentVerifiedAt: null,
          studentVerificationComments: null,

          // Reset faculty verification if assignment changes
          facultyVerified: false,
          facultyVerifiedAt: null,
          facultyVerificationComments: null,

          status: InternshipAssignmentStatus.PENDING_VERIFICATION,
        },
        create: {
          studentId: userId,
          internshipId: activeInternship.id,

          name,
          degreeProgram,
          email,
          semester,
          contactNo,
          preferredField,
          agreementAccepted,

          facultyId: facultyId || null,
          siteId: siteId || null,

          adminApprovalStatus: AdminApprovalStatus.PENDING,
        },
      });

    return NextResponse.json(
      {
        message: "AppEx B saved successfully",
        data: internshipAssignment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AppEx B create/update error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}