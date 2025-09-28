import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { comparePassword, signAccessToken, signRefreshToken, storeRefreshToken } from "@/utils/authhelper";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ message: "Invalid password" }, { status: 400 });
    }

    const accessToken = signAccessToken({ sub: user.id, name: user.name, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    await storeRefreshToken(user.id, refreshToken);

    const response = NextResponse.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
