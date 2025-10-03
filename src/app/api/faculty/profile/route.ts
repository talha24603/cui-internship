import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET method - Retrieve faculty profile
export async function GET(req: Request) {
  try {
    // Get user info from middleware headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Check if user is faculty
    if (userRole !== 'FACULTY') {
      return NextResponse.json({ error: "Access denied. Faculty role required" }, { status: 403 });
    }

    // Get faculty profile
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true,
          }
        }
      }
    });

    if (!facultyProfile) {
      return NextResponse.json({ 
        message: "Faculty profile not found",
        profile: null 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Faculty profile retrieved successfully",
      profile: facultyProfile
    });

  } catch (error) {
    console.error("Get faculty profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST method - Upsert faculty profile
export async function POST(req: Request) {
  try {
    const {
      department,
      designation,
      phone,
      office,
      bio,
      avatarUrl,
      qualifications,
      expertise
    } = await req.json();

    // Get user info from middleware headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Check if user is faculty
    if (userRole !== 'FACULTY') {
      return NextResponse.json({ error: "Access denied. Faculty role required" }, { status: 403 });
    }

    // Validate required fields
    if (!department || !designation) {
      return NextResponse.json({ 
        error: "Department and designation are required" 
      }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert faculty profile
    const facultyProfile = await prisma.facultyProfile.upsert({
      where: { userId },
      update: {
        department,
        designation,
        phone: phone || null,
        office: office || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        qualifications: qualifications || null,
        expertise: expertise || null,
      },
      create: {
        userId,
        department,
        designation,
        phone: phone || null,
        office: office || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        qualifications: qualifications || null,
        expertise: expertise || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: "Faculty profile updated successfully",
      profile: facultyProfile
    });

  } catch (error) {
    console.error("Upsert faculty profile error:", error);
    
    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: "Faculty profile already exists for this user" 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
