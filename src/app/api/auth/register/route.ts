import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { hashPassword, signEmailToken } from "@/utils/authhelper";
import { sendVerificationEmail } from "@/utils/mailer";

const CUI_SAHIWAL_STUDENT_EMAIL_REGEX = /^[a-z]{2}\d{2}-[a-z]{3}-\d{3}@students\.cuisahiwal\.edu\.pk$/i;

export async function POST(req: Request) {
  try {
    const { name, email, password, regNo } = await req.json();

    if (!name || !email || !password || !regNo) {
      return NextResponse.json({ message: "Name, email, password and regNo are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim();
    if (!CUI_SAHIWAL_STUDENT_EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Email must follow format AA00-BBB-XXX@students.cuisahiwal.edu.pk" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, password: hashedPassword, role: "STUDENT", regNo },
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
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
