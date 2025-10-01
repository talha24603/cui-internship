import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh-token",
    "/api/auth/verify-email",
    "/api/auth/verify-email-link",
    "/api/openapi",
    "/api/docs",
  ];

  if (publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const hasBearer = authHeader.startsWith("Bearer ");

  if (!hasBearer) {
    const origin = process.env.ALLOWED_ORIGIN || "";
    const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
    }
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};



