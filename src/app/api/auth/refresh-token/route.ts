import { NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken } from "@/utils/authhelper";

export async function OPTIONS() {
  const origin = process.env.ALLOWED_ORIGIN || "";
  const res = new NextResponse(null, { status: 204 });
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const refreshToken = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("refreshToken="))
      ?.split("=")[1]; 

    if (!refreshToken) {
      return NextResponse.json({ message: "Refresh token not provided" }, { status: 401 });
    }
    console.log("refreshToken",refreshToken);
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken({ sub: (payload as any).sub });

    const res = NextResponse.json({ accessToken: newAccessToken });
    const origin = process.env.ALLOWED_ORIGIN || "";
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
    }
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
  } catch {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }
}
