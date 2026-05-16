export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import {
  destroyCloudinaryRaw,
  getCloudinaryPublicIdFromUrl,
  uploadRawToCloudinary,
} from "@/utils/cloudinaryShared";
import { InternshipStatus } from "@prisma/client";

function getStudentUser(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return { userId: null, error: NextResponse.json({ error: "User information not found" }, { status: 401 }) };
  }

  if (role !== "STUDENT") {
    return {
      userId: null,
      error: NextResponse.json({ error: "Only students can submit a certificate" }, { status: 403 }),
    };
  }

  return { userId, error: null };
}

const ALLOWED_CERT_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function isAllowedCertificateFile(file: File) {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png") || n.endsWith(".webp")) {
    return true;
  }
  if (file.type && ALLOWED_CERT_MIME.has(file.type)) return true;
  return false;
}

function extFromFileName(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m?.[1] ?? "pdf";
}

function internshipAllowsCertificateSubmission(i: {
  status: InternshipStatus;
  endDate: Date | null;
}) {
  if (i.status === "COMPLETED") return true;
  if (i.endDate && i.endDate <= new Date()) return true;
  return false;
}

/**
 * GET /api/student/internship-certificate?internshipId=
 */
export async function GET(req: Request) {
  try {
    const { userId, error } = getStudentUser(req);
    if (error) return error;
    if (!userId) return NextResponse.json({ error: "User information not found" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("internshipId")?.trim();

    if (!internshipId) {
      return NextResponse.json({ error: "internshipId query parameter is required" }, { status: 400 });
    }

    const internship = await prisma.internship.findFirst({
      where: { id: internshipId, studentId: userId },
      select: {
        id: true,
        status: true,
        endDate: true,
        certificateUrl: true,
        certificateFileName: true,
        certificateSubmittedAt: true,
      },
    });

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Certificate status retrieved",
        internship: {
          id: internship.id,
          status: internship.status,
          endDate: internship.endDate,
          canSubmit: internshipAllowsCertificateSubmission(internship),
        },
        certificate:
          internship.certificateUrl && internship.certificateSubmittedAt
            ? {
                fileUrl: internship.certificateUrl,
                fileName: internship.certificateFileName,
                submittedAt: internship.certificateSubmittedAt,
              }
            : null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Get internship certificate error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/student/internship-certificate
 * Multipart: internshipId, file (PDF or image scan)
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
    if (!userId) return NextResponse.json({ error: "User information not found" }, { status: 401 });

    const formData = await req.formData();
    const internshipId = String(formData.get("internshipId") ?? "").trim();
    const file = formData.get("file");

    if (!internshipId) {
      return NextResponse.json({ error: "internshipId is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Certificate file is required" }, { status: 400 });
    }

    if (!isAllowedCertificateFile(file)) {
      return NextResponse.json(
        { error: "Allowed formats: PDF, JPEG, PNG, or WebP" },
        { status: 400 },
      );
    }

    const internship = await prisma.internship.findFirst({
      where: { id: internshipId, studentId: userId },
    });

    if (!internship) {
      return NextResponse.json({ error: "Internship not found for this student" }, { status: 404 });
    }

    if (!internshipAllowsCertificateSubmission(internship)) {
      return NextResponse.json(
        {
          error:
            "You can submit the internship certificate after the internship is completed or after the scheduled end date.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extFromFileName(file.name);
    const folder = `internship-certificates/${internshipId}`;
    const uploaded = await uploadRawToCloudinary(buffer, file.name, folder, ext);

    const previousUrl = internship.certificateUrl;
    if (previousUrl) {
      const oldId = getCloudinaryPublicIdFromUrl(previousUrl);
      if (oldId) await destroyCloudinaryRaw(oldId);
    }

    const updated = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        certificateUrl: uploaded.secure_url,
        certificateFileName: file.name,
        certificateSubmittedAt: new Date(),
      },
      select: {
        id: true,
        certificateUrl: true,
        certificateFileName: true,
        certificateSubmittedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Internship certificate uploaded successfully",
        certificate: {
          fileUrl: updated.certificateUrl,
          fileName: updated.certificateFileName,
          submittedAt: updated.certificateSubmittedAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Submit internship certificate error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
