import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { siteSupervisorId, companyId } = await req.json();

    // Validate required fields
    if (!siteSupervisorId || !companyId) {
      return NextResponse.json({ error: "Site supervisor ID and company ID are required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Verify site supervisor exists and has correct role
    const siteSupervisor = await prisma.user.findUnique({
      where: { id: siteSupervisorId },
      include: { company: true }
    });

    if (!siteSupervisor) {
      return NextResponse.json({ error: "Site supervisor not found" }, { status: 404 });
    }

    if (siteSupervisor.role !== 'SITE_SUPERVISOR') {
      return NextResponse.json({ error: "User is not a site supervisor" }, { status: 400 });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if supervisor is already assigned to a company
    if (siteSupervisor.companyId && siteSupervisor.companyId !== companyId) {
      return NextResponse.json({ 
        error: "Site supervisor is already assigned to another company",
        currentCompany: {
          id: siteSupervisor.company?.id,
          name: siteSupervisor.company?.name
        }
      }, { status: 409 });
    }

    // Assign site supervisor to company
    const updatedSupervisor = await prisma.user.update({
      where: { id: siteSupervisorId },
      data: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            industry: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Site supervisor assigned to company successfully",
      supervisor: {
        id: updatedSupervisor.id,
        name: updatedSupervisor.name,
        email: updatedSupervisor.email,
        company: updatedSupervisor.company
      },
      assignedBy: adminUserId
    });

  } catch (error) {
    console.error("Assign supervisor error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET endpoint to retrieve all site supervisors and their company assignments
export async function GET(req: Request) {
  try {
    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const unassigned = searchParams.get('unassigned') === 'true';

    // Build where clause
    const where: any = {
      role: 'SITE_SUPERVISOR'
    };

    if (companyId) {
      where.companyId = companyId;
    } else if (unassigned) {
      where.companyId = null;
    }

    // Get site supervisors
    const supervisors = await prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            industry: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      supervisors,
      total: supervisors.length
    });

  } catch (error) {
    console.error("Get supervisors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
