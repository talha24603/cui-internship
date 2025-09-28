import { NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken } from "@/utils/authhelper";

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

    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken({ sub: (payload as any).sub });

    return NextResponse.json({ accessToken: newAccessToken });
  } catch {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }
}
