import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { InternshipStatus } from "@prisma/client";
import { log } from "console";

// GET /api/site/internships
// - SITE_SUPERVISOR: returns internships where internship.siteId === current userId
export async function GET(req: Request) {
  try {
    const supervisorId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");
    console.log("Supervisor ID:", supervisorId, "Role:", role);

    if (!supervisorId || !role) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 },
      );
    }

    if (role !== "SITE_SUPERVISOR") {
      return NextResponse.json(
        { error: "Only site supervisors can access site internships" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const statusParam = (url.searchParams.get("status") ?? "all").trim();

    const where: {
      siteId: string;
      status?: InternshipStatus;
    } = {
      siteId: supervisorId,
    };

    if (statusParam !== "all") {
      const normalized = statusParam.toUpperCase();
      const allowed = Object.values(InternshipStatus);
      if (!allowed.includes(normalized as InternshipStatus)) {
        return NextResponse.json(
          {
            error:
              "Invalid status. Allowed: all, " +
              allowed.map((s) => s.toLowerCase()).join(", "),
          },
          { status: 400 },
        );
      }
      where.status = normalized as InternshipStatus;
    }

    const internships = await prisma.internship.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, regNo: true },
        },
        faculty: {
          select: { id: true, name: true, email: true },
        },
        site: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: { id: true, name: true, industry: true },
            },
          },
        },
        finalResult: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "Site supervisor internships retrieved successfully",
      data: internships,
    });
  } catch (error) {
    console.error("Get site internships error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

