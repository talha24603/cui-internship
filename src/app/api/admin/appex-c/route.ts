import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// GET /api/admin/appex-c - Get all AppEx C submissions (Admin only)
// GET /api/admin/appex-c?id=xxx - Get a specific AppEx C submission by ID (Admin only)
export async function GET(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can view AppEx C submissions" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      const proposal = await prisma.internshipProposal.findUnique({
        where: { id },
        select: {
          id: true,
          organizationOverview: true,
          roleDescription: true,
          keyActivities: true,
          toolsTechnologies: true,
          expectedDeliverables: true,
          submittedDate: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              regNo: true,
            },
          },
        },
      });

      if (!proposal) {
        return NextResponse.json({ error: "AppEx C submission not found" }, { status: 404 });
      }

      return NextResponse.json({
        message: "AppEx C submission retrieved successfully",
        data: proposal,
      });
    }

    const proposals = await prisma.internshipProposal.findMany({
      select: {
        id: true,
        organizationOverview: true,
        roleDescription: true,
        keyActivities: true,
        toolsTechnologies: true,
        expectedDeliverables: true,
        submittedDate: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            regNo: true,
          },
        },
      },
      orderBy: {
        submittedDate: "desc",
      },
    });

    return NextResponse.json({
      message: "AppEx C submissions retrieved successfully",
      data: proposals,
    });
  } catch (error) {
    console.error("Admin get AppEx C error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
