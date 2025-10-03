// app/api/generate-password/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export async function GET() {
  const password = generatePassword(12);
  return NextResponse.json({ password });
}
