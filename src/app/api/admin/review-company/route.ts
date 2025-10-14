import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// POST endpoint to approve or reject company requests
export async function POST(req: Request) {
  try {
    // Get user info from middleware headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    // Check if user is admin
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only admins can review company requests" }, { status: 403 });
    }

    // Parse request body
    const { requestId, action, notes } = await req.json();

    // Validate required fields
    if (!requestId || !action) {
      return NextResponse.json({ 
        error: "Request ID and action (approve/reject) are required" 
      }, { status: 400 });
    }

    // Validate action
    if (!['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
      return NextResponse.json({ 
        error: "Action must be either 'APPROVE' or 'REJECT'" 
      }, { status: 400 });
    }

    // Find the company request
    const companyRequest = await prisma.companyRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true
          }
        }
      }
    });

    if (!companyRequest) {
      return NextResponse.json({ 
        error: "Company request not found" 
      }, { status: 404 });
    }

    // Check if request is already reviewed
    if (companyRequest.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Company request has already been ${companyRequest.status.toLowerCase()}`,
        currentStatus: companyRequest.status,
        reviewedAt: companyRequest.reviewedAt
      }, { status: 409 });
    }

    const actionUpper = action.toUpperCase();
    const newStatus = actionUpper === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Start a transaction to update the request and potentially create a company
    const result = await prisma.$transaction(async (tx) => {
      // Update the company request
      const updatedRequest = await tx.companyRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewedById: userId!,
          reviewedAt: new Date(),
          notes: notes || null
        },
        include: {
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              regNo: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      let createdCompany = null;

      // If approved, create a company record
      if (actionUpper === 'APPROVE') {
        // Check if company already exists with this email
        const existingCompany = await tx.company.findUnique({
          where: { email: companyRequest.email }
        });

        if (!existingCompany) {
          createdCompany = await tx.company.create({
            data: {
              name: companyRequest.name,
              email: companyRequest.email,
              phone: companyRequest.phone,
              address: companyRequest.address,
              website: companyRequest.website,
              industry: companyRequest.industry,
              description: companyRequest.description
            }
          });
        }
      }

      return { updatedRequest, createdCompany };
    });

    return NextResponse.json({
      message: `Company request ${newStatus.toLowerCase()} successfully`,
      request: {
        id: result.updatedRequest.id,
        name: result.updatedRequest.name,
        email: result.updatedRequest.email,
        status: result.updatedRequest.status,
        notes: result.updatedRequest.notes,
        reviewedAt: result.updatedRequest.reviewedAt,
        requestedBy: result.updatedRequest.requestedBy,
        reviewedBy: result.updatedRequest.reviewedBy
      },
      company: result.createdCompany ? {
        id: result.createdCompany.id,
        name: result.createdCompany.name,
        email: result.createdCompany.email
      } : null
    }, { status: 200 });

  } catch (error) {
    console.error("Company review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET endpoint to retrieve company requests for review
export async function GET(req: Request) {
  try {
    // Get user info from middleware headers
    // const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    // Check if user is admin
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Only admins can view company requests" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by status
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get company requests with pagination
    const [requests, total] = await Promise.all([
      prisma.companyRequest.findMany({
        where,
        include: {
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              regNo: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.companyRequest.count({ where })
    ]);

    // Get summary statistics
    const stats = await prisma.companyRequest.groupBy({
      by: ['status'],
      _count: true
    });

    const statusCounts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0
    };

    stats.forEach(stat => {
      statusCounts[stat.status as keyof typeof statusCounts] = stat._count;
    });

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: statusCounts
    });

  } catch (error) {
    console.error("Get company requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
