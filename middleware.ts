import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";

  const withCors = (res: NextResponse) => {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Vary", "Origin");
    return res;
  };

  // Preflight request
  if (req.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  // Continue for normal requests
  return withCors(NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
