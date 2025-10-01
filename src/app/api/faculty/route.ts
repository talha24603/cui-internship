import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const faculties = await prisma.facultyProfile.findMany({
      select: {
        avatarUrl: true,
        expertise: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = faculties.map((f) => ({ name: f.user?.name ?? null, avatarUrl: f.avatarUrl ?? null, expertise: f.expertise ?? null }));
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch faculty profiles" }, { status: 500 });
  }
}


