import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET endpoint to retrieve site supervisors for a specific company
export async function GET(req: Request) {
  try {
    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get site supervisors for the company
    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SITE_SUPERVISOR',
        companyId: companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        createdAt: true,
        siteInternships: {
          select: {
            id: true,
            status: true,
            student: {
              select: {
                id: true,
                name: true,
                regNo: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get company information
    const companyWithSupervisors = {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      website: company.website,
      industry: company.industry,
      description: company.description,
      supervisors: supervisors,
      supervisorCount: supervisors.length
    };

    return NextResponse.json({
      company: companyWithSupervisors,
      totalSupervisors: supervisors.length
    });

  } catch (error) {
    console.error("Get company supervisors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET endpoint to retrieve all companies with their supervisor counts
export async function POST(req: Request) {
  try {
    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Get all companies with supervisor counts
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            siteSupervisors: true
          }
        },
        siteSupervisors: {
          select: {
            id: true,
            name: true,
            email: true,
            verified: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      companies: companies.map(company => ({
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        website: company.website,
        industry: company.industry,
        description: company.description,
        createdAt: company.createdAt,
        supervisorCount: company._count.siteSupervisors,
        supervisors: company.siteSupervisors
      }))
    });

  } catch (error) {
    console.error("Get companies with supervisors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

