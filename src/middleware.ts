export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/utils/authhelper";

// Whitelisted frontends
// const allowedOrigins = [
//   "http://localhost:4200",                   // dev
//   "https://cui-internship-system.vercel.app",
//   "https://cui-internship-system-git-dev-zas-projects-7d9cf03b.vercel.app" // prod
// ];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const url = new URL(req.url);
  const requestHeaders = new Headers(req.headers);

  const setCorsHeaders = (response: NextResponse) => {
    // --- CORS ---
    // Allow all origins
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    } else {
      response.headers.set("Access-Control-Allow-Origin", "*");
    }

    // Previous CORS logic with allowedOrigins check:
    // if (allowedOrigins.includes(origin)) {
    //   response.headers.set("Access-Control-Allow-Origin", origin );
    //   response.headers.set("Access-Control-Allow-Credentials", "true");
    // }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    const requestedHeaders = req.headers.get("access-control-request-headers");
    response.headers.set(
      "Access-Control-Allow-Headers",
      requestedHeaders || "Content-Type, Authorization, Cache-Control"
    );
  };

  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    setCorsHeaders(preflight);
    return preflight;
  }

  // --- Authentication for protected routes ---
  if (url.pathname.startsWith("/api/admin/") || 
      url.pathname.startsWith("/api/faculty/") ||
      url.pathname.startsWith("/api/student/") ||
      url.pathname.startsWith("/api/site/") ||
      url.pathname.startsWith("/api/dropdown/")) {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header with Bearer token is required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // strip "Bearer "
    try {
      const payload = verifyAccessToken(token);

      // Pass user info for downstream handlers (let APIs handle role checking)
      requestHeaders.set("x-user-id", String(payload.sub));
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-user-name", payload.name || "");
      requestHeaders.set("x-user-email", payload.email || "");
      requestHeaders.set("x-supervisor-id", typeof payload.supervisorId === "string" ? payload.supervisorId : "");
      requestHeaders.set("x-faculty-id", typeof payload.facultyId === "string" ? payload.facultyId : "");

    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token " + err },
        { status: 401 }
      );
    }
  }

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  setCorsHeaders(res);
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
