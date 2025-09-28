import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyEmailToken } from "@/utils/authhelper";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    const payload = verifyEmailToken(token);

    await prisma.user.update({
      where: { id: (payload as any).sub },
      data: { verified: true },
    });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
  }
}
