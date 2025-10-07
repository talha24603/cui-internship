import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/utils/authhelper";
import prisma from "@/utils/prisma";
// Prisma client with connection pooling for serverless
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// const prisma = globalForPrisma.prisma ?? new PrismaClient({
//   log: ['error'],
// });

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header missing or invalid" }, { status: 401 });
    }

    // Verify access token
    const token = authHeader.substring(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Check if user is a student
    if (payload.role !== 'STUDENT') {
      return NextResponse.json({ error: "Only students can request new companies" }, { status: 403 });
    }

    // Parse request body
    const { name, email, phone, address, website, industry, description, reason } = await req.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Company name and email are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email }
    });

    if (existingCompany) {
      return NextResponse.json({ 
        error: "Company with this email already exists in the system",
        existingCompany: {
          id: existingCompany.id,
          name: existingCompany.name,
          email: existingCompany.email
        }
      }, { status: 409 });
    }

    // Check if there's already a pending request for this company
    const existingRequest = await prisma.companyRequest.findFirst({
      where: { 
        email,
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return NextResponse.json({ 
        error: "A request for this company is already pending approval",
        existingRequest: {
          id: existingRequest.id,
          name: existingRequest.name,
          email: existingRequest.email,
          requestedAt: existingRequest.createdAt
        }
      }, { status: 409 });
    }

    // Create new company request
    const companyRequest = await prisma.companyRequest.create({
      data: {
        name,
        email,
        phone,
        address,
        website,
        industry,
        description,
        reason,
        requestedById: payload.sub as string,
        status: "PENDING"
      },
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

    return NextResponse.json({
      message: "Company request submitted successfully",
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
        requestedBy: companyRequest.requestedBy,
        createdAt: companyRequest.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Company request error:", error);
    
    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: "A request for this company already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET endpoint to retrieve student's own company requests
export async function GET(req: Request) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header missing or invalid" }, { status: 401 });
    }

    // Verify access token
    const token = authHeader.substring(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Check if user is a student
    if (payload.role !== 'STUDENT') {
      return NextResponse.json({ error: "Only students can view their company requests" }, { status: 403 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      requestedById: payload.sub as string
    };

    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    // Get company requests
    const [requests, total] = await Promise.all([
      prisma.companyRequest.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.companyRequest.count({ where })
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get company requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
