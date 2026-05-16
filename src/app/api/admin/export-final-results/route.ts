import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

function validateAdmin(req: Request) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || !role) {
    return {
      errorResponse: NextResponse.json({ error: "User information not found" }, { status: 401 }),
    };
  }

  if (role !== "ADMIN") {
    return {
      errorResponse: NextResponse.json({ error: "Only admins can access this resource" }, { status: 403 }),
    };
  }

  return { errorResponse: null as NextResponse | null };
}

/** Normalize batch prefix for regNo match, e.g. AB24-CSE- (format AA00-BBB-) */
function normalizeBatchPrefix(raw: string): string {
  let p = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (/^[A-Z]{2}\d{2}-[A-Z]{3}$/.test(p)) {
    p += "-";
  }
  return p;
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function sanitizeFilenamePart(prefix: string): string {
  return prefix.replace(/[^A-Z0-9-]/gi, "_").replace(/_+/g, "_").slice(0, 64) || "batch";
}

/**
 * GET /api/admin/export-final-results?prefix=AB24-CSE-&finalizedOnly=true
 * CSV of final internship results for students whose regNo starts with prefix (same batch).
 */
export async function GET(req: Request) {
  const auth = validateAdmin(req);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const url = new URL(req.url);
  const rawPrefix = url.searchParams.get("prefix") ?? "";
  const prefix = normalizeBatchPrefix(rawPrefix);

  if (!prefix || prefix.length < 8) {
    return NextResponse.json(
      { error: "Query parameter prefix is required (e.g. AB24-CSE- for students with reg. no. AA00-BBB-000)." },
      { status: 400 },
    );
  }

    const finalizedOnly = url.searchParams.get("finalizedOnly") !== "false";

  try {
    const internships = await prisma.internship.findMany({
      where: {
        student: {
          regNo: { startsWith: prefix, mode: "insensitive" },
        },
        finalResult: finalizedOnly
          ? { is: { isFinalizedByFaculty: true } }
          : { isNot: null },
      },
      include: {
        student: {
          select: { name: true, email: true, regNo: true },
        },
        finalResult: true,
      },
      orderBy: {
        student: { regNo: "asc" },
      },
    });

    const header = [
      "Registration No",
      "Student Name",
      "Email",
      "Internship Type",
      "Internship Status",
      "Faculty Marks",
      "Site Marks",
      "Office Marks",
      "Presentation Marks",
      "Total Marks",
      "Status",
      "Faculty Finalized",
      "Finalized At",
    ];

    const dataRows: string[][] = internships.map((row) => {
      const fr = row.finalResult!;
      const finalizedAt = fr.finalizedAt ? fr.finalizedAt.toISOString() : "";
      return [
        row.student.regNo ?? "",
        row.student.name ?? "",
        row.student.email ?? "",
        row.type,
        row.status,
        String(fr.facultyMarks),
        fr.siteMarks != null ? String(fr.siteMarks) : "",
        String(fr.officeMarks),
        fr.presentationMarks != null ? String(fr.presentationMarks) : "",
        String(fr.totalMarks),
        fr.status,
        fr.isFinalizedByFaculty ? "Yes" : "No",
        finalizedAt,
      ];
    });

    const titleRow = [`Internship final results — batch prefix ${prefix}`, "", "", "", "", "", "", "", "", "", "", ""];
    const metaRow = [
      `Generated ${new Date().toISOString()}`,
      finalizedOnly ? "Rows: faculty-finalized only" : "Rows: all records with a final result",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    const body = buildCsv([titleRow, metaRow, [], header, ...dataRows]);
    const csv = `\ufeff${body}`;

    const filename = `final-results-${sanitizeFilenamePart(prefix)}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Admin export final results error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
