import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyEmailToken } from "@/utils/authhelper";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");  

  if (!token) {
    return new Response(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>❌ Verification Failed</h2>
        <p>No token provided.</p>
        <a href="${process.env.APP_URL || "/"}">Go to App</a>
      </body></html>
    `, { headers: { "Content-Type": "text/html" }, status: 400 });
  }

  try {
    const payload = verifyEmailToken(token);
    await prisma.user.update({
      where: { id: (payload as any).sub },
      data: { verified: true },
    });

    return new Response(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>✅ Email Verified Successfully!</h2>
        <p>You can now log in.</p>
        <a href="${process.env.APP_URL || "https://cui-internship-system.vercel.app/login"}/login">Go to Login</a>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });
  } catch {
    return new Response(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>❌ Verification Failed</h2>
        <p>Invalid or expired token.</p>
        <a href="${process.env.APP_URL || "/"}">Go to App</a>
      </body></html>
    `, { headers: { "Content-Type": "text/html" }, status: 400 });
  }
}
