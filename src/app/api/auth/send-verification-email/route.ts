import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { signEmailToken } from "@/utils/authhelper";
import { sendVerificationEmail } from "@/utils/mailer";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.verified) {
      return NextResponse.json({ message: "Email is already verified" }, { status: 400 });
    }

    try {
      // Generate new verification token
      const emailToken = signEmailToken(user.id);
      
      // Send verification email
      await sendVerificationEmail(user.email, emailToken);
      
      return NextResponse.json({ 
        message: "Verification email sent successfully" 
      });
    } catch (error) {
      console.error("Email sending error:", error);
      return NextResponse.json({ 
        message: "Failed to send verification email" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
