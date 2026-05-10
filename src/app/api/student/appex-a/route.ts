import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { InternshipApprovalStatus, InternshipStatus, InternshipType } from "@prisma/client";

/* ------------------ Helper ------------------ */

function resolveInternshipType(mode: string): InternshipType {
  const normalizedMode = mode.trim().toLowerCase();

  if (normalizedMode.includes("fiverr") || normalizedMode.includes("freelance")) {
    return InternshipType.FIVERR;
  }
  if (normalizedMode.includes("remote")) {
    return InternshipType.REMOTE;
  }
  return InternshipType.ONSITE;
}

/* ------------------ Validation ------------------ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-()]{6,19}$/;
const ALLOWED_MODES = ["onsite", "remote", "hybrid", "fiverr", "freelance"];
const MIN_INTERNSHIP_WEEKS = 6;

type AppexAInput = {
  organization?: unknown;
  address?: unknown;
  industrySector?: unknown;
  contactName?: unknown;
  contactDesignation?: unknown;
  contactPhone?: unknown;
  contactEmail?: unknown;
  internshipLocation?: unknown;
  internshipNature?: unknown;
  mode?: unknown;
  numberOfInternship?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  workingDays?: unknown;
  workingHours?: unknown;
};

function isNonEmptyString(value: unknown, min = 1, max = 500): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function validateAppexA(
  data: AppexAInput,
  options: { partial?: boolean } = {}
): { ok: true } | { ok: false; error: string } {
  const partial = options.partial ?? false;
  const required = (key: keyof AppexAInput) => !partial || data[key] !== undefined;

  const checks: Array<{ when: boolean; ok: boolean; error: string }> = [
    {
      when: required("organization"),
      ok: isNonEmptyString(data.organization, 2, 200),
      error: "organization must be 2-200 characters",
    },
    {
      when: required("address"),
      ok: isNonEmptyString(data.address, 5, 500),
      error: "address must be 5-500 characters",
    },
    {
      when: required("industrySector"),
      ok: isNonEmptyString(data.industrySector, 2, 100),
      error: "industrySector must be 2-100 characters",
    },
    {
      when: required("contactName"),
      ok: isNonEmptyString(data.contactName, 2, 100),
      error: "contactName must be 2-100 characters",
    },
    {
      when: required("contactDesignation"),
      ok: isNonEmptyString(data.contactDesignation, 2, 100),
      error: "contactDesignation must be 2-100 characters",
    },
    {
      when: required("contactPhone"),
      ok: typeof data.contactPhone === "string" && PHONE_REGEX.test(data.contactPhone.trim()),
      error: "contactPhone is not a valid phone number",
    },
    {
      when: required("contactEmail"),
      ok: typeof data.contactEmail === "string" && EMAIL_REGEX.test(data.contactEmail.trim()),
      error: "contactEmail is not a valid email",
    },
    {
      when: required("internshipLocation"),
      ok: isNonEmptyString(data.internshipLocation, 2, 200),
      error: "internshipLocation must be 2-200 characters",
    },
    {
      when: required("internshipNature"),
      ok: isNonEmptyString(data.internshipNature, 2, 200),
      error: "internshipNature must be 2-200 characters",
    },
    {
      when: required("mode"),
      ok:
        typeof data.mode === "string" &&
        ALLOWED_MODES.includes(data.mode.trim().toLowerCase()),
      error: `mode must be one of: ${ALLOWED_MODES.join(", ")}`,
    },
    {
      when: required("numberOfInternship"),
      ok:
        typeof data.numberOfInternship === "string" &&
        Number.isInteger(Number(data.numberOfInternship)) &&
        Number(data.numberOfInternship) >= 1 &&
        Number(data.numberOfInternship) <= 100,
      error: "numberOfInternship must be an integer between 1 and 100",
    },
    {
      when: required("workingDays"),
      ok: isNonEmptyString(data.workingDays, 2, 100),
      error: "workingDays must be 2-100 characters",
    },
    {
      when: required("workingHours"),
      ok: isNonEmptyString(data.workingHours, 2, 100),
      error: "workingHours must be 2-100 characters",
    },
  ];

  for (const check of checks) {
    if (check.when && !check.ok) {
      return { ok: false, error: check.error };
    }
  }

  return { ok: true };
}

function validateDateRange(
  startDate: unknown,
  endDate: unknown
): { ok: true; start: Date; end: Date } | { ok: false; error: string } {
  if (typeof startDate !== "string" || typeof endDate !== "string") {
    return { ok: false, error: "startDate and endDate must be ISO date strings" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: "startDate or endDate is not a valid date" };
  }

  if (start >= end) {
    return { ok: false, error: "startDate must be earlier than endDate" };
  }

  const weeks = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7);
  if (weeks < MIN_INTERNSHIP_WEEKS) {
    return {
      ok: false,
      error: `Internship duration must be at least ${MIN_INTERNSHIP_WEEKS} weeks`,
    };
  }

  return { ok: true, start, end };
}

/* ------------------ Active Internship ------------------ */

async function getActiveInternshipId(studentId: string) {
  const internship = await prisma.internship.findFirst({
    where: {
      studentId,
      status: { not: InternshipStatus.REJECTED },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return internship?.id ?? null;
}

/* ------------------ GET ------------------ */

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internshipId = await getActiveInternshipId(userId);

    if (!internshipId) {
      return NextResponse.json({ error: "No internship found" }, { status: 404 });
    }

    const appexA = await prisma.internshipApproval.findFirst({
      where: { internshipId },
    });

    return NextResponse.json({
      message: "AppEx A fetched successfully",
      appexA,
    });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------ POST (CREATE) ------------------ */

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      organization,
      address,
      industrySector,
      contactName,
      contactDesignation,
      contactPhone,
      contactEmail,
      internshipLocation,
      internshipNature,
      mode,
      numberOfInternship,
      startDate,
      endDate,
      workingDays,
      workingHours,
    } = body;

    const validation = validateAppexA(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const dateCheck = validateDateRange(startDate, endDate);
    if (!dateCheck.ok) {
      return NextResponse.json({ error: dateCheck.error }, { status: 400 });
    }
    const { start, end } = dateCheck;

    const internshipType = resolveInternshipType(mode);

    const pendingInternship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: InternshipStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!pendingInternship) {
      return NextResponse.json(
        {
          error:
            "No pending internship found. Please create an internship first before submitting AppEx A.",
        },
        { status: 400 }
      );
    }

    const internshipId = pendingInternship.id;

    const existing = await prisma.internshipApproval.findFirst({
      where: { internshipId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "AppEx A already exists. Use update instead." },
        { status: 409 }
      );
    }

    const appexA = await prisma.internshipApproval.create({
      data: {
        studentId: userId,
        internshipId,

        organization,
        address,
        industrySector,
        contactName,
        contactDesignation,
        contactPhone,
        contactEmail,
        internshipNature,
        internshipLocation,
        mode,
        numberOfInternship,

        startDate: start,
        endDate: end,

        workingDays,
        workingHours,

        status: InternshipApprovalStatus.PENDING,
      },
    });

    await prisma.internship.update({
      where: { id: internshipId },
      data: {
        type: internshipType,
        status: InternshipStatus.PENDING,
      },
    });

    return NextResponse.json(
      {
        message: "AppEx A created successfully",
        appexA,
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------ PUT (UPDATE / RESUBMIT) ------------------ */

export async function PUT(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      organization,
      address,
      industrySector,
      contactName,
      contactDesignation,
      contactPhone,
      contactEmail,
      internshipLocation,
      internshipNature,
      mode,
      numberOfInternship,
      startDate,
      endDate,
      workingDays,
      workingHours,
    } = body;

    const validation = validateAppexA(body, { partial: true });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const internshipId = await getActiveInternshipId(userId);

    if (!internshipId) {
      return NextResponse.json({ error: "No internship found" }, { status: 404 });
    }

    const existing = await prisma.internshipApproval.findFirst({
      where: { internshipId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AppEx A not found. Create first." },
        { status: 404 }
      );
    }
    if (existing.status !== InternshipApprovalStatus.REJECTED) {
      return NextResponse.json(
        { error: "AppEx A can only be updated after rejection" },
        { status: 403 }
      );
    }

    const effectiveStart = startDate ?? existing.startDate.toISOString();
    const effectiveEnd = endDate ?? existing.endDate.toISOString();

    const dateCheck = validateDateRange(effectiveStart, effectiveEnd);
    if (!dateCheck.ok) {
      return NextResponse.json({ error: dateCheck.error }, { status: 400 });
    }
    const { start, end } = dateCheck;

    const updatedAppexA = await prisma.internshipApproval.update({
      where: { internshipId },
      data: {
        organization: organization ?? existing.organization,
        address: address ?? existing.address,
        industrySector: industrySector ?? existing.industrySector,
        contactName: contactName ?? existing.contactName,
        contactDesignation: contactDesignation ?? existing.contactDesignation,
        contactPhone: contactPhone ?? existing.contactPhone,
        contactEmail: contactEmail ?? existing.contactEmail,
        internshipNature: internshipNature ?? existing.internshipNature,
        internshipLocation: internshipLocation ?? existing.internshipLocation,
        mode: mode ?? existing.mode,
        numberOfInternship: numberOfInternship ?? existing.numberOfInternship,

        startDate: start,
        endDate: end,

        workingDays: workingDays ?? existing.workingDays,
        workingHours: workingHours ?? existing.workingHours,

        status: InternshipApprovalStatus.PENDING,
      },
    });

    const internshipType = resolveInternshipType(mode ?? existing.mode);

    await prisma.internship.update({
      where: { id: internshipId },
      data: {
        type: internshipType,
        status: InternshipStatus.PENDING,
      },
    });

    return NextResponse.json({
      message: "AppEx A updated successfully",
      appexA: updatedAppexA,
    });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}