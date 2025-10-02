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

  const origin = req.headers.get("origin") || "*"; // fallback to *
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_ORIGIN,
    process.env.ALLOWED_ORIGIN,
    "https://cui-internship-system.vercel.app", // your frontend
  ].filter(Boolean) as string[];

  // If no whitelist, allow all
  const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  const withCors = (res: NextResponse) => {
    res.headers.set("Access-Control-Allow-Origin", isAllowed ? origin : "*");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
    return res;
  };

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    const requestHeaders =
      req.headers.get("access-control-request-headers") || "Content-Type, Authorization";
    return withCors(
      new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": requestHeaders,
        },
      })
    );
  }

  // Public routes (no auth check)
  if (publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return withCors(NextResponse.next());
  }

  // Auth check for protected routes
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return withCors(NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
  }

  return withCors(NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
