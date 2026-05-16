import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import {
  AdminApprovalStatus,
  InternshipApprovalStatus,
  InternshipAssignmentStatus,
  InternshipStatus,
} from "@prisma/client";
import { calculateTotalWeeks } from "@/utils/internship-dates";
import type { TimelineItem } from "@/types/internship-timeline";

/**
 * GET /api/student/internship-timeline
 * Aggregates internship workflow steps for the student's latest internship (by createdAt).
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (userRole !== "STUDENT") {
      return NextResponse.json({ error: "Only students can view their timeline" }, { status: 403 });
    }

    const internship = await prisma.internship.findFirst({
      where: { studentId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        internshipApproval: true,
        internshipAssignment: true,
        internshipProposal: true,
        weeklyLogs: { orderBy: { weekNo: "asc" } },
        reports: {
          where: { type: "final" },
          orderBy: { submittedDate: "desc" },
          take: 1,
        },
        finalResult: true,
      },
    });

    if (!internship) {
      return NextResponse.json({
        message: "No internship yet",
        internshipId: null,
        items: [
          {
            id: "create-internship",
            title: "Create internship",
            subtitle: "Start your internship record before AppEx A.",
            state: "pending" as const,
            href: "/student/internships",
            kind: "milestone" as const,
          },
        ],
      });
    }

    const approval = internship.internshipApproval;
    const assignment = internship.internshipAssignment;
    const proposal = internship.internshipProposal;
    const finalReport = internship.reports[0] ?? null;

    const appexAApproved = approval?.status === InternshipApprovalStatus.APPROVED;
    const appexARejected = approval?.status === InternshipApprovalStatus.REJECTED;
    const appexASubmitted = Boolean(approval);

    const appexBDone = Boolean(assignment);
    const appexBVerifiedDone =
      assignment?.status === InternshipAssignmentStatus.BOTH_VERIFIED &&
      assignment.adminApprovalStatus === AdminApprovalStatus.APPROVED;

    const proposalDone = Boolean(proposal);

    const internshipActive =
      internship.status === InternshipStatus.APPROVED ||
      internship.status === InternshipStatus.COMPLETED;

    let totalWeeks = 0;
    if (internship.startDate && internship.endDate) {
      totalWeeks = calculateTotalWeeks(internship.startDate, internship.endDate);
    }

    const submittedWeekSet = new Set(internship.weeklyLogs.map((l) => l.weekNo));

    const items: TimelineItem[] = [];

    items.push({
      id: "create-internship",
      title: "Internship created",
      subtitle: `Record started (${internship.type}).`,
      state: "completed",
      href: "/student/internships",
      kind: "milestone",
    });

    items.push({
      id: "appex-a",
      title: "AppEx A — Site approval form",
      subtitle: appexARejected
        ? "Rejected — update and resubmit from AppEx A."
        : appexAApproved
          ? "Approved by administration."
          : appexASubmitted
            ? "Awaiting administration approval."
            : "Submit organization and placement details.",
      state: appexARejected ? "rejected" : appexAApproved ? "completed" : appexASubmitted ? "pending" : "pending",
      href: "/student/appex-a",
      kind: "milestone",
    });

    items.push({
      id: "appex-b",
      title: "AppEx B — Assignment (supervisors & agreement)",
      subtitle: !appexAApproved
        ? "Available after AppEx A is approved."
        : appexBDone
          ? "Assignment submitted."
          : "Fill supervisor details and accept the agreement.",
      state: !appexAApproved ? "blocked" : appexBDone ? "completed" : "pending",
      href: "/student/appex-b",
      kind: "milestone",
    });

    items.push({
      id: "appex-b-verify",
      title: "AppEx B — Verification & admin approval",
      subtitle: !appexBDone
        ? "Submit AppEx B first."
        : appexBVerifiedDone
          ? "Faculty, student, and admin approvals complete."
          : "Faculty and student verify; admin approves AppEx B.",
      state: !appexBDone ? "blocked" : appexBVerifiedDone ? "completed" : "pending",
      href: "/student/appex-b-verification",
      kind: "milestone",
    });

    items.push({
      id: "appex-c",
      title: "AppEx C — Internship proposal",
      subtitle: !appexBVerifiedDone
        ? "Unlocks after AppEx B is fully approved."
        : proposalDone
          ? "Proposal submitted."
          : "Describe role, activities, and deliverables.",
      state: !appexBVerifiedDone ? "blocked" : proposalDone ? "completed" : "pending",
      href: "/student/appex-c",
      kind: "milestone",
    });

    if (!internship.startDate || !internship.endDate || totalWeeks === 0) {
      items.push({
        id: "weekly-logs-placeholder",
        title: "Weekly logs",
        subtitle: internshipActive
          ? "Week-by-week logs appear once start and end dates are set on your internship."
          : "Available once your internship is approved and dates are confirmed.",
        state: "blocked",
        href: "/student/weekly-logs",
        kind: "milestone",
      });
    } else if (!internshipActive) {
      items.push({
        id: "weekly-logs-gated",
        title: "Weekly logs",
        subtitle: "Requires an approved internship.",
        state: "blocked",
        href: "/student/weekly-logs",
        kind: "milestone",
      });
    } else {
      for (let w = 1; w <= totalWeeks; w++) {
        const done = submittedWeekSet.has(w);
        items.push({
          id: `weekly-${w}`,
          title: `Week ${w} log`,
          subtitle: done ? "Submitted." : "Submit activities, skills, and challenges for this week.",
          state: done ? "completed" : "pending",
          href: `/student/weekly-logs?week=${w}`,
          kind: "weekly",
          weekNo: w,
        });
      }
    }

    const reportDone = Boolean(finalReport?.fileUrl);

    items.push({
      id: "final-report",
      title: "Final internship report (PDF)",
      subtitle: reportDone ? "Final report uploaded." : "Upload your PDF report and optional summary.",
      state: !internshipActive ? "blocked" : reportDone ? "completed" : "pending",
      href: "/student/internship-report#final-report-section",
      kind: "milestone",
    });

    const certDone = Boolean(internship.certificateUrl);

    items.push({
      id: "certificate",
      title: "Completion certificate",
      subtitle: certDone
        ? "Certificate on file."
        : "Upload after your internship ends or is marked completed.",
      state: !internshipActive ? "blocked" : certDone ? "completed" : "pending",
      href: "/student/internship-report#internship-certificate-section",
      kind: "milestone",
    });

    const finalDone = Boolean(internship.finalResult);

    items.push({
      id: "final-result",
      title: "Final result",
      subtitle: finalDone
        ? "Marks and grade published."
        : "Available after faculty finalizes your result.",
      state: finalDone ? "completed" : "pending",
      href: "/student/final-result",
      kind: "milestone",
    });

    return NextResponse.json({
      message: "Timeline loaded",
      internshipId: internship.id,
      internshipStatus: internship.status,
      items,
    });
  } catch (error) {
    console.error("internship-timeline error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
