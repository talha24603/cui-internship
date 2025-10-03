import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/utils/authhelper";

// Whitelisted frontends
const allowedOrigins = [
  "http://localhost:4200",                   // dev
  "https://cui-internship-system.vercel.app",
  "https://cui-internship-system-git-dev-zas-projects-7d9cf03b.vercel.app" // prod
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const url = new URL(req.url);

  const res = NextResponse.next();

  // --- CORS ---
  if (allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin );
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  // --- Authentication for protected routes ---
  if (url.pathname.startsWith("/api/admin/") || 
      url.pathname.startsWith("/api/faculty/")) {
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
      res.headers.set("x-user-id", String(payload.sub));
      res.headers.set("x-user-role", payload.role);
      res.headers.set("x-user-name", payload.name || "");
      res.headers.set("x-user-email", payload.email || "");

    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
