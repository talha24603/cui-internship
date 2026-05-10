import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { InternshipStatus } from "@prisma/client";

// POST /api/student/appex-c - Create or update AppEx C (Internship Proposal)
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 401 }
      );
    }

    if (userRole !== "STUDENT"  ) {
      return NextResponse.json(
        { error: "Only students can submit AppEx C" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      organizationOverview,
      roleDescription,
      keyActivities,
      toolsTechnologies,
      expectedDeliverables,
    } = body;

    const requiredFields = [
      "organizationOverview",
      "roleDescription",
      "keyActivities",
      "toolsTechnologies",
      "expectedDeliverables",
    ];

    for (const field of requiredFields) {
      const value = body[field];
      if (!value || typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          { error: `Missing or invalid field: ${field}` },
          { status: 400 }
        );
      }
    }

    const activeInternship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: { in: [InternshipStatus.PENDING, InternshipStatus.APPROVED] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!activeInternship) {
      return NextResponse.json(
        { error: "No active internship attempt found. Please submit AppEx A first." },
        { status: 400 }
      );
    }

    const existingProposal = await prisma.internshipProposal.findFirst({
      where: { internshipId: activeInternship.id },
      select: { id: true },
    });

    const proposalData = {
      organizationOverview,
      roleDescription,
      keyActivities,
      toolsTechnologies,
      expectedDeliverables,
    };

    const internshipProposal = existingProposal
      ? await prisma.internshipProposal.update({
          where: { id: existingProposal.id },
          data: proposalData,
        })
      : await prisma.internshipProposal.create({
          data: {
            studentId: userId,
            internshipId: activeInternship.id,
            ...proposalData,
          },
        });

    return NextResponse.json(
      {
        message: "AppEx C saved successfully",
        internshipProposal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Create/Update AppEx C error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

