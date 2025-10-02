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

  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_ORIGIN,   // e.g. https://your-frontend.com
    process.env.ALLOWED_ORIGIN,           // optional extra
    "https://cui-internship-system.vercel.app", // frontend prod app
  ].filter(Boolean) as string[];

  const isAllowedOrigin =
    allowedOrigins.length === 0
      ? true // if you want to allow all in dev, set empty to allow all (careful in prod)
      : allowedOrigins.includes(origin);

  const withCors = (res: NextResponse) => {
    if (isAllowedOrigin && origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return res;
  };

  // Preflight (CORS) requests
  if (req.method === "OPTIONS") {
    const requestHeaders = req.headers.get("access-control-request-headers") || "Content-Type, Authorization";
    const res = new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": requestHeaders,
        // Access-Control-Allow-Origin/Allow-Credentials added via withCors
      },
    });
    return withCors(res);
  }

  // Skip auth check for public paths
  if (publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return withCors(NextResponse.next());
  }

  // Check for Bearer token
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    const res = NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
    return withCors(res);
  }

  // Authorized request
  return withCors(NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};