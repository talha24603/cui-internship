import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const { id, name, email, phone, address, website, industry, description } = await req.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: { siteSupervisors: true }
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      // Check if email is already taken by another company
      const emailExists = await prisma.company.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (website !== undefined) updateData.website = website;
    if (industry !== undefined) updateData.industry = industry;
    if (description !== undefined) updateData.description = description;

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
      include: { siteSupervisors: true }
    });

    return NextResponse.json({
      message: "Company updated successfully",
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        phone: updatedCompany.phone,
        address: updatedCompany.address,
        website: updatedCompany.website,
        industry: updatedCompany.industry,
        description: updatedCompany.description,
        siteSupervisors: updatedCompany.siteSupervisors.map(supervisor => ({
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
        })),
        createdAt: updatedCompany.createdAt,
        updatedAt: updatedCompany.updatedAt,
      },
      updatedBy: adminUserId,
    });

  } catch (error) {
    console.error("Edit company error:", error);
    
    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
