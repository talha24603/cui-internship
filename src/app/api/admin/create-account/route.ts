import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
      const { email, name,password,role } = await req.json();
  
      if (!email || !name || !password || !role) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
  
    // generate random password
      
  
      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // save user
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
        message: "User registered",
        user: { id: user.id, email: user.email, name: user.name },
        password: password, // temporary - only to show how to return
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }