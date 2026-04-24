import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: { 
        siteSupervisors: {
          include: {
            siteInternships: true,
            evaluations: true
          }
        }
      }
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if company has site supervisors with active internships
    const supervisorsWithActiveInternships = existingCompany.siteSupervisors.filter(
      supervisor => supervisor.siteInternships.length > 0
    );

    if (supervisorsWithActiveInternships.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete company with site supervisors who have active internships. Please reassign or complete internships first." 
      }, { status: 400 });
    }

    // Check if company has site supervisors with evaluations
    const supervisorsWithEvaluations = existingCompany.siteSupervisors.filter(
      supervisor => supervisor.evaluations.length > 0
    );

    if (supervisorsWithEvaluations.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete company with site supervisors who have evaluations. Please contact system administrator." 
      }, { status: 400 });
    }

    // Revoke all refresh tokens for site supervisors
    const supervisorIds = existingCompany.siteSupervisors.map(supervisor => supervisor.id);
    if (supervisorIds.length > 0) {
      await prisma.refreshToken.updateMany({
        where: { 
          userId: { in: supervisorIds }
        },
        data: { revoked: true }
      });
    }

    // Delete all site supervisors first
    if (existingCompany.siteSupervisors.length > 0) {
      await prisma.user.deleteMany({
        where: { 
          id: { in: supervisorIds }
        }
      });
    }

    // Delete the company
    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Company deleted successfully",
      deletedCompany: {
        id: existingCompany.id,
        name: existingCompany.name,
        email: existingCompany.email,
        siteSupervisorsCount: existingCompany.siteSupervisors.length,
      },
      deletedBy: adminUserId,
    });

  } catch (error) {
    console.error("Delete company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
