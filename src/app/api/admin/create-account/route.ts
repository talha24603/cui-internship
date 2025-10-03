import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
      const { email, name, password, role } = await req.json();
  
      if (!email || !name || !password || !role) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      // Get admin user info from middleware headers
      const adminUserId = req.headers.get('x-user-id');
      const adminUserRole = req.headers.get('x-user-role');
      
      if (!adminUserId || adminUserRole !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
      }

      // Validate role enum
      if (!['ADMIN', 'USER', 'FACULTY'].includes(role)) {
        return NextResponse.json({ error: "Invalid role. Must be ADMIN, USER, or FACULTY" }, { status: 400 });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Save user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: role,
          verified: true,
        },
      });
  
      // ⚠️ never store plain password, but you may send it via email
      return NextResponse.json({
        message: "User created successfully",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        password: password, // temporary - only to show how to return
        createdBy: adminUserId,
      });
    } catch (error) {
      console.error("Create account error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }