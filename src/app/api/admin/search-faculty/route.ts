import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/admin/search-faculty?q=searchterm - Search faculty members (Admin only)
export async function GET(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can search faculty" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q") || url.searchParams.get("search") || "";

    // If no search query, return all faculty (with limit)
    const where: any = {
      role: "FACULTY",
    };

    if (searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { facultyProfile: { department: { contains: searchQuery, mode: "insensitive" } } },
        { facultyProfile: { designation: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    const faculty = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        createdAt: true,
        facultyProfile: {
          select: {
            department: true,
            designation: true,
            phone: true,
            office: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 50, // Limit results to 50
    });

    return NextResponse.json({
      message: "Faculty search completed successfully",
      data: faculty,
      count: faculty.length,
    });
  } catch (error) {
    console.error("Search faculty error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
