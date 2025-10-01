import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPasswordResetToken } from "@/utils/authhelper";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const payload = verifyPasswordResetToken(token);
    const userId = (payload as any).sub as string;

    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return NextResponse.json({ message: "Password reset successful" });
  } catch {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
  }
}


