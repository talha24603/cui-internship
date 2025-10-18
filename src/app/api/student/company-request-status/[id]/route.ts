import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET endpoint to retrieve a specific company request status for a student
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user info from middleware headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    // Check if user is a student
    if (userRole !== 'STUDENT') {
      return NextResponse.json({ 
        error: "Only students can view company request status" 
      }, { status: 403 });
    }

    const requestId = params.id;

    // Validate request ID format (should be a valid UUID)
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ 
        error: "Valid request ID is required" 
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

    if (!companyRequest) {
      return NextResponse.json({ 
        error: "Company request not found" 
      }, { status: 404 });
    }

    // Check if the request belongs to the current student
    if (companyRequest.requestedById !== userId) {
      return NextResponse.json({ 
        error: "You can only view your own company requests" 
      }, { status: 403 });
    }

    // Return the company request with status information
    return NextResponse.json({
      request: {
        id: companyRequest.id,
        name: companyRequest.name,
        email: companyRequest.email,
        phone: companyRequest.phone,
        address: companyRequest.address,
        website: companyRequest.website,
        industry: companyRequest.industry,
        description: companyRequest.description,
        reason: companyRequest.reason,
        status: companyRequest.status,
        notes: companyRequest.notes,
        createdAt: companyRequest.createdAt,
        updatedAt: companyRequest.updatedAt,
        reviewedAt: companyRequest.reviewedAt,
        requestedBy: companyRequest.requestedBy,
        reviewedBy: companyRequest.reviewedBy
      },
      statusInfo: {
        currentStatus: companyRequest.status,
        isPending: companyRequest.status === 'PENDING',
        isApproved: companyRequest.status === 'APPROVED',
        isRejected: companyRequest.status === 'REJECTED',
        submittedAt: companyRequest.createdAt,
        lastUpdatedAt: companyRequest.updatedAt,
        reviewedAt: companyRequest.reviewedAt,
        hasNotes: !!companyRequest.notes
      }
    });

  } catch (error) {
    console.error("Get company request status error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}
