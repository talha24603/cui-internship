import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/admin/search-site-supervisors?q=searchterm - Search site supervisors (Admin only)
export async function GET(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can search site supervisors" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("q") || url.searchParams.get("search") || "";

    // If no search query, return all site supervisors (with limit)
    const where: any = {
      role: "SITE_SUPERVISOR",
    };

    if (searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { company: { name: { contains: searchQuery, mode: "insensitive" } } },
        { company: { email: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    const siteSupervisors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            industry: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 50, // Limit results to 50
    });

    return NextResponse.json({
      message: "Site supervisors search completed successfully",
      data: siteSupervisors,
      count: siteSupervisors.length,
    });
  } catch (error) {
    console.error("Search site supervisors error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
