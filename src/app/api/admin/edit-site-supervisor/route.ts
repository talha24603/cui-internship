import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const { id, email, name, password, companyId } = await req.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Site supervisor ID is required" }, { status: 400 });
    }

    // Get admin user info from middleware headers
    const adminUserId = req.headers.get('x-user-id');
    const adminUserRole = req.headers.get('x-user-role');
    
    if (!adminUserId || adminUserRole !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if site supervisor exists
    const existingSupervisor = await prisma.user.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!existingSupervisor) {
      return NextResponse.json({ error: "Site supervisor not found" }, { status: 404 });
    }

    if (existingSupervisor.role !== 'SITE_SUPERVISOR') {
      return NextResponse.json({ error: "User is not a site supervisor" }, { status: 400 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
    }

    // Validate company if provided
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (companyId !== undefined) updateData.companyId = companyId;

    // Update site supervisor
    const updatedSupervisor = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { company: true }
    });

    return NextResponse.json({
      message: "Site supervisor updated successfully",
      supervisor: {
        id: updatedSupervisor.id,
        email: updatedSupervisor.email,
        name: updatedSupervisor.name,
        role: updatedSupervisor.role,
        verified: updatedSupervisor.verified,
        company: updatedSupervisor.company ? {
          id: updatedSupervisor.company.id,
          name: updatedSupervisor.company.name,
          email: updatedSupervisor.company.email,
        } : null,
        updatedAt: updatedSupervisor.updatedAt,
      },
      updatedBy: adminUserId,
    });

  } catch (error) {
    console.error("Edit site supervisor error:", error);
    
    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
