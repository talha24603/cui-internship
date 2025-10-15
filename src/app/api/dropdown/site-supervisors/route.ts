import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Get user info from middleware headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');

    // Build where clause
    const whereClause: any = {
      role: 'SITE_SUPERVISOR',
      verified: true
    };

    // Add company filter if provided
    if (companyId) {
      whereClause.companyId = companyId;
    }

    // Add search filter if provided
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get site supervisors with their company information
    const supervisors = await prisma.user.findMany({
      where: whereClause,
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform data for dropdown
    const dropdownData = supervisors.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.name || 'Unknown',
      email: supervisor.email,
      company: supervisor.company ? {
        id: supervisor.company.id,
        name: supervisor.company.name,
        industry: supervisor.company.industry || 'Not specified'
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: dropdownData,
      total: dropdownData.length
    });

  } catch (error) {
    console.error("Get site supervisors dropdown error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}
