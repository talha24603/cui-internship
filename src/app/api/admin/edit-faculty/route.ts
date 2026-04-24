import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const { id, email, name, password, department, designation, phone, office, bio, avatarUrl, qualifications, expertise } = await req.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if faculty exists
    const existingFaculty = await prisma.user.findUnique({
      where: { id },
      include: { facultyProfile: true }
    });

    if (!existingFaculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    if (existingFaculty.role !== 'FACULTY') {
      return NextResponse.json({ error: "User is not a faculty member" }, { status: 400 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { facultyProfile: true }
    });

    // Update or create faculty profile
    const facultyProfileData: any = {};
    if (department !== undefined) facultyProfileData.department = department;
    if (designation !== undefined) facultyProfileData.designation = designation;
    if (phone !== undefined) facultyProfileData.phone = phone;
    if (office !== undefined) facultyProfileData.office = office;
    if (bio !== undefined) facultyProfileData.bio = bio;
    if (avatarUrl !== undefined) facultyProfileData.avatarUrl = avatarUrl;
    if (qualifications !== undefined) facultyProfileData.qualifications = qualifications;
    if (expertise !== undefined) facultyProfileData.expertise = expertise;

    let facultyProfile;
    if (existingFaculty.facultyProfile) {
      facultyProfile = await prisma.facultyProfile.update({
        where: { userId: id },
        data: facultyProfileData
      });
    } else {
      facultyProfile = await prisma.facultyProfile.create({
        data: {
          userId: id,
          ...facultyProfileData
        }
      });
    }

    return NextResponse.json({
      message: "Faculty updated successfully",
      faculty: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        verified: updatedUser.verified,
        profile: {
          department: facultyProfile.department,
          designation: facultyProfile.designation,
          phone: facultyProfile.phone,
          office: facultyProfile.office,
          bio: facultyProfile.bio,
          avatarUrl: facultyProfile.avatarUrl,
          qualifications: facultyProfile.qualifications,
          expertise: facultyProfile.expertise,
        },
        updatedAt: updatedUser.updatedAt,
      },
      updatedBy: adminUserId,
    });

  } catch (error) {
    console.error("Edit faculty error:", error);
    
    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
