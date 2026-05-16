export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import {
  destroyCloudinaryRaw,
  getCloudinaryPublicIdFromUrl,
  uploadRawToCloudinary,
} from "@/utils/cloudinaryShared";

const GLOBAL_ID = "global";

function validateAdmin(req: Request) {
  const role = req.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can access this resource" }, { status: 403 });
  }
  return null;
}

const WORD_MIME = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function isWordFile(file: File) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return true;
  if (file.type && WORD_MIME.has(file.type)) return true;
  return false;
}

/**
 * GET /api/admin/reference-letter
 * Current global template (for admin UI).
 */
export async function GET(req: Request) {
  const authError = validateAdmin(req);
  if (authError) return authError;

  try {
    const row = await prisma.universityReferenceLetter.findUnique({
      where: { id: GLOBAL_ID },
    });

    return NextResponse.json(
      {
        message: "Reference letter template status",
        referenceLetter: row
          ? {
              fileUrl: row.fileUrl,
              fileName: row.fileName,
              updatedAt: row.updatedAt,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Admin get reference letter error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/reference-letter
 * Multipart: file (.doc or .docx) — shared template for every student.
 */
export async function POST(req: Request) {
  const authError = validateAdmin(req);
  if (authError) return authError;

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

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Word document file is required" }, { status: 400 });
    }

    if (!isWordFile(file)) {
      return NextResponse.json(
        { error: "Only Microsoft Word files (.doc, .docx) are allowed" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = "reference-letters/university-template";
    const ext = file.name.toLowerCase().match(/\.(docx|doc)$/)?.[1] ?? "docx";

    const uploaded = await uploadRawToCloudinary(buffer, file.name, folder, ext);

    const previous = await prisma.universityReferenceLetter.findUnique({
      where: { id: GLOBAL_ID },
    });

    if (previous?.fileUrl) {
      const oldId = getCloudinaryPublicIdFromUrl(previous.fileUrl);
      if (oldId) await destroyCloudinaryRaw(oldId);
    }

    const row = await prisma.universityReferenceLetter.upsert({
      where: { id: GLOBAL_ID },
      create: {
        id: GLOBAL_ID,
        fileUrl: uploaded.secure_url,
        fileName: file.name,
      },
      update: {
        fileUrl: uploaded.secure_url,
        fileName: file.name,
      },
    });

    return NextResponse.json(
      {
        message: "University reference letter template updated successfully",
        referenceLetter: {
          fileUrl: row.fileUrl,
          fileName: row.fileName,
          updatedAt: row.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Admin reference letter upload error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
