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
    const department = searchParams.get('department');

    // Build where clause
    const whereClause: any = {
      user: {
        role: 'FACULTY',
        verified: true
      }
    };

    // Add search filter if provided
    if (search) {
      whereClause.user.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Add department filter if provided
    if (department) {
      whereClause.department = {
        contains: department,
        mode: 'insensitive'
      };
    }

    // Get faculty with their profiles
    const faculties = await prisma.facultyProfile.findMany({
      where: whereClause,
      select: {
        id: true,
        department: true,
        designation: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    // Transform data for dropdown
    const dropdownData = faculties.map(faculty => ({
      id: faculty.user.id,
      name: faculty.user.name || 'Unknown',
      email: faculty.user.email,
      department: faculty.department || 'Not specified',
      designation: faculty.designation || 'Not specified'
    }));

    return NextResponse.json({
      success: true,
      data: dropdownData,
      total: dropdownData.length
    });

  } catch (error) {
    console.error("Get faculty dropdown error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}