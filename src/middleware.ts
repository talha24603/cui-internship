import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", "https://cui-internship-system.vercel.app");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
