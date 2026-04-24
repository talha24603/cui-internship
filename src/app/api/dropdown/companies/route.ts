import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

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
    const industry = searchParams.get('industry');

    // Build where clause
    const whereClause: any = {};

    // Add search filter if provided
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Add industry filter if provided
    if (industry) {
      whereClause.industry = {
        contains: industry,
        mode: 'insensitive'
      };
    }

    // Get companies with supervisor counts
    const companies = await prisma.company.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        industry: true,
        description: true,
        _count: {
          select: {
            siteSupervisors: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform data for dropdown
    const dropdownData = companies.map(company => ({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      website: company.website,
      industry: company.industry || 'Not specified',
      description: company.description,
      supervisorCount: company._count.siteSupervisors
    }));

    return NextResponse.json({
      success: true,
      data: dropdownData,
      total: dropdownData.length
    });

  } catch (error) {
    console.error("Get companies dropdown error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}
