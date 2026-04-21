export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { v2 as cloudinary } from "cloudinary";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getCloudinaryPublicIdFromUrl(fileUrl: string) {
  try {
    const marker = "/upload/";
    const markerIndex = fileUrl.indexOf(marker);
    if (markerIndex === -1) return null;

    let publicPart = fileUrl.substring(markerIndex + marker.length);
    publicPart = publicPart.replace(/^v\d+\//, "");
    publicPart = publicPart.replace(/\.[^./]+$/, "");
    return publicPart || null;
  } catch {
    return null;
  }
}

async function uploadPdfToCloudinary(file: File, internshipId: string) {
  const safeName = sanitizeFileName(file.name || "internship-report.pdf");
  const baseName = safeName.replace(/\.[^.]+$/, "");
  const publicId = `${Date.now()}-${baseName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  return await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: `internship-reports/${internshipId}`,
        public_id: publicId,
        format: "pdf",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secure_url: result.secure_url });
      },
    );

    stream.end(buffer);
  });
}

function getStudentUser(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      userId: null,
      error: NextResponse.json({ error: "User information not found" }, { status: 401 }),
    };
  }

  if (role !== "STUDENT") {
    return {
      userId: null,
      error: NextResponse.json(
        { error: "Only students can access internship reports" },
        { status: 403 },
      ),
    };
  }

  return { userId, error: null };
}

function getReportViewer(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      userId: null,
      role: null,
      error: NextResponse.json({ error: "User information not found" }, { status: 401 }),
    };
  }

  if (role === "SITE_SUPERVISOR") {
    return {
      userId: null,
      role: null,
      error: NextResponse.json(
        { error: "Site supervisors are not allowed to access internship reports" },
        { status: 403 },
      ),
    };
  }

  return { userId, role, error: null };
}

/**
 * GET /api/student/internship-report
 * Optional query param: internshipId
 * Returns latest final report for the authenticated student.
 */
export async function GET(req: Request) {
  try {
    const { userId, role, error } = getReportViewer(req);
    if (error) return error;
    if (!userId || !role) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("internshipId")?.trim();

    const isStudent = role === "STUDENT";
    let internship = null;

    if (internshipId) {
      internship = await prisma.internship.findFirst({
        where: isStudent ? { id: internshipId, studentId: userId } : { id: internshipId },
        include: {
          reports: {
            where: { type: "final" },
            orderBy: { submittedDate: "desc" },
            take: 1,
          },
        },
      });
    } else {
      if (!isStudent) {
        return NextResponse.json(
          { error: "internshipId query parameter is required for non-student roles" },
          { status: 400 },
        );
      }

      internship = await prisma.internship.findFirst({
        where: { studentId: userId },
        orderBy: { endDate: "desc" },
        include: {
          reports: {
            where: { type: "final" },
            orderBy: { submittedDate: "desc" },
            take: 1,
          },
        },
      });
    }

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const report = internship.reports[0] ?? null;

    return NextResponse.json(
      {
        message: "Internship final report retrieved successfully",
        internship: {
          id: internship.id,
          status: internship.status,
          startDate: internship.startDate,
          endDate: internship.endDate,
        },
        report,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Get internship final report error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/student/internship-report
 * Multipart form-data:
 * - internshipId: string
 * - file: PDF file
 * - summary?: string
 */
export async function POST(req: Request) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        },
        { status: 500 },
      );
    }

    const { userId, error } = getStudentUser(req);
    if (error) return error;
    if (!userId) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    const formData = await req.formData();
    const internshipId = String(formData.get("internshipId") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const file = formData.get("file");

    if (!internshipId) {
      return NextResponse.json({ error: "internshipId is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const isPdfMime = file.type === "application/pdf";
    const isPdfName = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfName) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const internship = await prisma.internship.findFirst({
      where: { id: internshipId, studentId: userId },
    });

    if (!internship) {
      return NextResponse.json(
        { error: "Internship not found for this student" },
        { status: 404 },
      );
    }

    if (!internship.endDate || internship.endDate > new Date()) {
      return NextResponse.json(
        { error: "Internship report can only be submitted after internship end date" },
        { status: 400 },
      );
    }

    const uploaded = await uploadPdfToCloudinary(file, internshipId);
    const publicFileUrl = uploaded.secure_url;

    const existingFinalReport = await prisma.internshipReport.findFirst({
      where: { internshipId, type: "final" },
      orderBy: { submittedDate: "desc" },
    });

    let report;

    if (existingFinalReport) {
      const oldPublicId = getCloudinaryPublicIdFromUrl(existingFinalReport.fileUrl ?? "");
      if (oldPublicId) {
        await cloudinary.uploader
          .destroy(oldPublicId, { resource_type: "raw", invalidate: true })
          .catch(() => undefined);
      }

      report = await prisma.internshipReport.update({
        where: { id: existingFinalReport.id },
        data: {
          fileUrl: publicFileUrl,
          summary: summary || null,
          submittedDate: new Date(),
        },
      });
    } else {
      report = await prisma.internshipReport.create({
        data: {
          internshipId,
          type: "final",
          fileUrl: publicFileUrl,
          summary: summary || null,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Internship final report submitted successfully",
        report,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Submit internship final report error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
