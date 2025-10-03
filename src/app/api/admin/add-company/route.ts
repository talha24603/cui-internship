import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, website, industry, description } = await req.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if company with this email already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email }
    });

    if (existingCompany) {
      return NextResponse.json({ error: "Company with this email already exists" }, { status: 409 });
    }

    // Create new company
    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        address,
        website,
        industry,
        description,
      },
    });

    return NextResponse.json({
      message: "Company added successfully",
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        website: company.website,
        industry: company.industry,
        description: company.description,
        createdAt: company.createdAt,
      },
      createdBy: adminUserId,
    });

  } catch (error) {
    console.error("Add company error:", error);
    
    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: "Company with this email already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
