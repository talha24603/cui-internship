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

  // Preflight (CORS) requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Skip auth check for public paths
  if (publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
  }

  // Check for Bearer token
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }

  // Authorized request
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
