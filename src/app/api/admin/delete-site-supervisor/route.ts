import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Site supervisor ID is required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if site supervisor exists
    const existingSupervisor = await prisma.user.findUnique({
      where: { id },
      include: { 
        company: true,
        siteInternships: true,
        evaluations: true
      }
    });

    if (!existingSupervisor) {
      return NextResponse.json({ error: "Site supervisor not found" }, { status: 404 });
    }

    if (existingSupervisor.role !== 'SITE_SUPERVISOR') {
      return NextResponse.json({ error: "User is not a site supervisor" }, { status: 400 });
    }

    // Check if site supervisor has any active internships
    if (existingSupervisor.siteInternships.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete site supervisor with active internships. Please reassign or complete internships first." 
      }, { status: 400 });
    }

    // Check if site supervisor has any evaluations
    if (existingSupervisor.evaluations.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete site supervisor with evaluations. Please contact system administrator." 
      }, { status: 400 });
    }

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revoked: true }
    });

    // Delete the site supervisor user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Site supervisor deleted successfully",
      deletedSupervisor: {
        id: existingSupervisor.id,
        email: existingSupervisor.email,
        name: existingSupervisor.name,
        role: existingSupervisor.role,
        company: existingSupervisor.company ? {
          id: existingSupervisor.company.id,
          name: existingSupervisor.company.name,
        } : null,
      },
      deletedBy: adminUserId,
    });

  } catch (error) {
    console.error("Delete site supervisor error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
