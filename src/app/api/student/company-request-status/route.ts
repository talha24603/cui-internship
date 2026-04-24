import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET endpoint to retrieve all company requests for a student with status information
export async function GET(req: Request) {
  try {
    // Get user info from middleware headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    // Check if user is a student
    if (userRole !== 'STUDENT') {
      return NextResponse.json({ 
        error: "Only students can view their company requests" 
      }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Build where clause - only filter by student ID
    const where = {
      requestedById: userId!
    };

    // Get all company requests
    const requests = await prisma.companyRequest.findMany({
      where,
      include: {
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
      ]
    });

    // Format the response with additional status information
    const formattedRequests = requests.map(request => ({
      id: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone,
      address: request.address,
      website: request.website,
      industry: request.industry,
      description: request.description,
      reason: request.reason,
      status: request.status,
      notes: request.notes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
      statusInfo: {
        currentStatus: request.status,
        isPending: request.status === 'PENDING',
        isApproved: request.status === 'APPROVED',
        isRejected: request.status === 'REJECTED',
        submittedAt: request.createdAt,
        lastUpdatedAt: request.updatedAt,
        reviewedAt: request.reviewedAt,
        hasNotes: !!request.notes
      }
    }));

    const response: any = {
      requests: formattedRequests,
      total: formattedRequests.length
    };

    // Include statistics if requested
    if (includeStats) {
      const stats = await prisma.companyRequest.groupBy({
        by: ['status'],
        where: { requestedById: userId! },
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

      response.statistics = {
        total: formattedRequests.length,
        byStatus: statusCounts,
        pendingCount: statusCounts.PENDING,
        approvedCount: statusCounts.APPROVED,
        rejectedCount: statusCounts.REJECTED
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Get company requests status error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}
