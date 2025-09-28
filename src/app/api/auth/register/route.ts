import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword, signEmailToken } from "@/utils/authhelper";
import { sendVerificationEmail } from "@/utils/mailer";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    try {
      const emailToken = signEmailToken(user.id);
      await sendVerificationEmail(user.email, emailToken);
      return NextResponse.json({
        message: "User created. Please check email for verification link.",
        user: { id: user.id, name: user.name, email: user.email },
      }, { status: 201 });
    } catch {
      return NextResponse.json({
        message: "User created but email verification failed.",
        user: { id: user.id, name: user.name, email: user.email },
      }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
