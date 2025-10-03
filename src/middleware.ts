// import { NextResponse } from "next/server";
// import { verifyAccessToken } from "@/utils/authhelper";

// export function middleware(req: Request) {
//   const res = NextResponse.next();

//   res.headers.set("Access-Control-Allow-Origin", "*");
//   res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
//     return new NextResponse(null, { status: 204, headers: res.headers });
//   }

//   // Check if this is an admin route that requires authentication
//   const url = new URL(req.url);
//   if (url.pathname.startsWith('/api/admin/')) {
//     const authHeader = req.headers.get('Authorization');
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return NextResponse.json(
//         { error: "Authorization header with Bearer token is required" },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
//     try {
//       const payload = verifyAccessToken(token);
      
//       // Check if user has admin role
//       if (payload.role !== 'ADMIN') {
//         return NextResponse.json(
//           { error: "Admin access required" },
//           { status: 403 }
//         );
//       }
      
//       // Add user info to headers for use in the route handler
//       res.headers.set('x-user-id', payload.sub as string);
//       res.headers.set('x-user-role', payload.role as string);
      
//     } catch (error) {
//       return NextResponse.json(
//         { error: "Invalid or expired token" },
//         { status: 401 }
//       );
//     }
//   }

//   return res;
// }

// export const config = {
//   matcher: "/api/:path*",
// };
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/utils/authhelper";

// Whitelisted frontends
const allowedOrigins = [
  "http://localhost:3000",                   // dev
  "https://cui-internship-system.vercel.app" // prod
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const url = new URL(req.url);

  const res = NextResponse.next();

  // --- CORS ---
  if (allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin || "https://cui-internship-system.vercel.app");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  // --- Admin protection ---
  if (url.pathname.startsWith("/api/admin/")) {
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

      if (payload.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }

      // Pass user info for downstream handlers
      res.headers.set("x-user-id", String(payload.sub));
      res.headers.set("x-user-role", payload.role);

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
