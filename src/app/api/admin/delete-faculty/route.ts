import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

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
      include: { 
        facultyProfile: true,
        facultyInternships: true,
        evaluations: true
      }
    });

    if (!existingFaculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    if (existingFaculty.role !== 'FACULTY') {
      return NextResponse.json({ error: "User is not a faculty member" }, { status: 400 });
    }

    // Check if faculty has any active internships
    if (existingFaculty.facultyInternships.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete faculty with active internships. Please reassign or complete internships first." 
      }, { status: 400 });
    }

    // Check if faculty has any evaluations
    if (existingFaculty.evaluations.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete faculty with evaluations. Please contact system administrator." 
      }, { status: 400 });
    }

    // Delete faculty profile first (if exists)
    if (existingFaculty.facultyProfile) {
      await prisma.facultyProfile.delete({
        where: { userId: id }
      });
    }

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revoked: true }
    });

    // Delete the faculty user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Faculty deleted successfully",
      deletedFaculty: {
        id: existingFaculty.id,
        email: existingFaculty.email,
        name: existingFaculty.name,
        role: existingFaculty.role,
      },
      deletedBy: adminUserId,
    });

  } catch (error) {
    console.error("Delete faculty error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
