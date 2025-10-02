import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { comparePassword, signAccessToken, signRefreshToken, storeRefreshToken } from "@/utils/authhelper";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 400 });

    const valid = await comparePassword(password, user.password);
    if (!valid) return NextResponse.json({ message: "Invalid password" }, { status: 400 });

    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });
    await storeRefreshToken(user.id, refreshToken);

    const res = NextResponse.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}




// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { comparePassword, signAccessToken, signRefreshToken, storeRefreshToken } from "@/utils/authhelper";

// const prisma = new PrismaClient();

// export async function OPTIONS() {
//   const origin = process.env.ALLOWED_ORIGIN || "";
//   const res = new NextResponse(null, { status: 204 });
//   if (origin) {
//     res.headers.set("Access-Control-Allow-Origin", origin);
//     res.headers.set("Vary", "Origin");
//   }
//   res.headers.set("Access-Control-Allow-Credentials", "true");
//   res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   return res;
// }

// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json();
//     if (!email || !password) {
//       return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return NextResponse.json({ message: "User not found" }, { status: 400 });
//     }

//     const isPasswordCorrect = await comparePassword(password, user.password);
//     if (!isPasswordCorrect) {
//       return NextResponse.json({ message: "Invalid password" }, { status: 400 });
//     }

//     const accessToken = signAccessToken({ sub: user.id, name: user.name, email: user.email });
//     const refreshToken = signRefreshToken({ sub: user.id });

//     await storeRefreshToken(user.id, refreshToken);

//     const response = NextResponse.json({
//       message: "Login successful",
//       user: { id: user.id, name: user.name, email: user.email },
//       accessToken,
//     });

//     response.cookies.set("refreshToken", refreshToken, {
//       httpOnly: true,
//       sameSite: "none",
//       secure: true,
//       maxAge: 7 * 24 * 60 * 60, // 7 days
//     });

//     const origin = process.env.ALLOWED_ORIGIN || "";
//     if (origin) {
//       response.headers.set("Access-Control-Allow-Origin", origin);
//       response.headers.set("Vary", "Origin");
//     }
//     response.headers.set("Access-Control-Allow-Credentials", "true");

//     return response;
//   } catch {
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 });
//   }
// }
