import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { signPasswordResetToken } from "@/utils/authhelper";
import { sendPasswordResetEmail } from "@/utils/mailer";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Respond 200 to avoid user enumeration
      return NextResponse.json({ message: "If the email exists, a reset link was sent" });
    }

    const token = signPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ message: "If the email exists, a reset link was sent" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


