import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { InternshipType, InternshipStatus } from "@prisma/client";

// POST /api/student/create-internship
export async function POST(req: Request) {
  try {
    // Get user info from middleware headers (already verified)
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== 'STUDENT') {
      return NextResponse.json({ error: "Only students can create internships" }, { status: 403 });
    }

    const body = await req.json();
    const rawType: unknown = body?.type;
    const facultyId: string | undefined = body?.facultyId ?? undefined;
    const siteId: string | undefined = body?.siteId ?? undefined;

    // Validate internship type
    const validTypes = Object.values(InternshipType);
    if (!rawType || typeof rawType !== 'string' || !validTypes.includes(rawType as InternshipType)) {
      return NextResponse.json({ error: "Invalid or missing internship type. Allowed: ONSITE, REMOTE, FIVERR" }, { status: 400 });
    }
    const type = rawType as InternshipType;

    // Validate site supervisor if provided
    if (siteId) {
      const siteSupervisor = await prisma.user.findUnique({
        where: { id: siteId },
        include: { company: true }
      });

      if (!siteSupervisor) {
        return NextResponse.json({ error: "Site supervisor not found" }, { status: 404 });
      }

      if (siteSupervisor.role !== 'SITE_SUPERVISOR') {
        return NextResponse.json({ error: "User is not a site supervisor" }, { status: 400 });
      }

      if (!siteSupervisor.company) {
        return NextResponse.json({ error: "Site supervisor is not assigned to any company" }, { status: 400 });
      }
    }

    // Validate faculty if provided
    if (facultyId) {
      const faculty = await prisma.user.findUnique({
        where: { id: facultyId }
      });

      if (!faculty) {
        return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
      }

      if (faculty.role !== 'FACULTY') {
        return NextResponse.json({ error: "User is not a faculty member" }, { status: 400 });
      }
    }

    // Ensure student does not already have a pending/approved internship
    const existing = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: { in: [InternshipStatus.PENDING, InternshipStatus.APPROVED] },
      },
      select: { id: true, status: true }
    });

    if (existing) {
      return NextResponse.json({ error: "You already have an active internship request" }, { status: 409 });
    }

    const created = await prisma.internship.create({
      data: {
        studentId: userId,
        type,
        status: InternshipStatus.PENDING,
        facultyId: facultyId ?? null,
        siteId: siteId ?? null,
      },
      include: {
        student: { select: { id: true, name: true, email: true, regNo: true } },
        faculty: { select: { id: true, name: true, email: true } },
        site: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true
              }
            }
          } 
        },
      }
    });

    return NextResponse.json({
      message: "Internship created successfully",
      internship: created,
    }, { status: 201 });

  } catch (error) {
    console.error("Create internship error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


