export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { PdfReader } from "pdfreader";
import { evaluateInternshipReportWithGrok } from "@/utils/ai/evaluateInternshipReport";
import {
  destroyCloudinaryRaw,
  getCloudinaryPublicIdFromUrl,
  uploadRawToCloudinary,
} from "@/utils/cloudinaryShared";

async function uploadPdfToCloudinary(buffer: Buffer, fileName: string, internshipId: string) {
  return uploadRawToCloudinary(buffer, fileName, `internship-reports/${internshipId}`, "pdf");
}

async function extractPdfText(buffer: Buffer) {
  return await new Promise<string>((resolve) => {
    const lines: string[] = [];
    let currentY: number | null = null;
    let currentLineParts: string[] = [];

    const flushLine = () => {
      const line = currentLineParts.join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
      currentLineParts = [];
    };

    new PdfReader().parseBuffer(buffer, (error, item) => {
      if (error) {
        const parsedError: unknown = error;
        const message = parsedError instanceof Error ? parsedError.message : "Unknown PDF parsing error";
        console.warn("Failed to extract PDF text:", message);
        resolve("");
        return;
      }

      if (!item) {
        flushLine();
        resolve(lines.join("\n").trim());
        return;
      }

      if (typeof item.y === "number" && currentY !== item.y) {
        flushLine();
        currentY = item.y;
      }

      if (typeof item.text === "string" && item.text.trim()) {
        currentLineParts.push(item.text);
      }
    });
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

function isNonEmptyFile(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}

/**
 * POST /api/student/internship-report
 * Multipart form-data:
 * - internshipId: string
 * - file?: PDF file (required on first submit; optional when replacing PDF or when updating summary only)
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
    const fileField = formData.get("file");
    const hasFile = isNonEmptyFile(fileField);

    if (!internshipId) {
      return NextResponse.json({ error: "internshipId is required" }, { status: 400 });
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

    const existingFinalReport = await prisma.internshipReport.findFirst({
      where: { internshipId, type: "final" },
      orderBy: { submittedDate: "desc" },
    });

    if (!existingFinalReport && !hasFile) {
      return NextResponse.json(
        { error: "A PDF file is required for the first submission" },
        { status: 400 },
      );
    }

    if (existingFinalReport && !hasFile) {
      const report = await prisma.internshipReport.update({
        where: { id: existingFinalReport.id },
        data: {
          summary: summary || null,
          submittedDate: new Date(),
        },
      });

      return NextResponse.json(
        {
          message: "Final report summary updated successfully",
          report,
          aiAssessmentGenerated: false,
        },
        { status: 200 },
      );
    }

    const file = fileField as File;
    const isPdfMime = file.type === "application/pdf";
    const isPdfName = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfName) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractPdfText(pdfBuffer);

    if (!extractedText && !summary) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from PDF in current server environment. Please provide the summary field so AI evaluation can proceed.",
        },
        { status: 400 },
      );
    }

    const uploaded = await uploadPdfToCloudinary(pdfBuffer, file.name, internshipId);
    const publicFileUrl = uploaded.secure_url;

    let report;

    if (existingFinalReport) {
      const oldPublicId = getCloudinaryPublicIdFromUrl(existingFinalReport.fileUrl ?? "");
      if (oldPublicId) {
        await destroyCloudinaryRaw(oldPublicId);
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

    const reportTextForAi = extractedText
      ? extractedText
      : `Internship report text extraction was unavailable in this environment.

Student provided summary:
${summary}`.trim();

    const aiAssessment = await evaluateInternshipReportWithGrok({
      reportText: reportTextForAi,
      studentSummary: summary,
      internshipId,
    }).catch((error) => {
      console.warn("AI report assessment failed:", error);
      return null;
    });

    if (aiAssessment) {
      const existingAiEvaluation = await prisma.evaluation.findFirst({
        where: {
          internshipId,
          type: "ai_report_review",
        },
        orderBy: { submittedDate: "desc" },
      });

      const aiDetails = {
        model: process.env.GROK_MODEL || "grok-3-mini",
        reportId: report.id,
        reportFileUrl: report.fileUrl,
        extractedTextLength: extractedText.length,
        assessment: aiAssessment,
      };

      if (existingAiEvaluation) {
        await prisma.evaluation.update({
          where: { id: existingAiEvaluation.id },
          data: {
            marks: aiAssessment.suggestedMarks.total,
            comments: aiAssessment.summary,
            details: aiDetails,
            submittedDate: new Date(),
          },
        });
      } else {
        await prisma.evaluation.create({
          data: {
            internshipId,
            evaluatorId: null,
            type: "ai_report_review",
            marks: aiAssessment.suggestedMarks.total,
            comments: aiAssessment.summary,
            details: aiDetails,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: existingFinalReport
          ? "Final internship report updated successfully"
          : "Internship final report submitted successfully",
        report,
        aiAssessmentGenerated: Boolean(aiAssessment),
      },
      { status: existingFinalReport ? 200 : 201 },
    );
  } catch (err) {
    console.error("Submit internship final report error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
