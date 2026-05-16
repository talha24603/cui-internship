import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

const GLOBAL_ID = "global";

/**
 * GET /api/student/reference-letter
 * Returns the shared university reference letter template (Word) for all students.
 * Not tied to internship — available to any logged-in student when admin has published it.
 */
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || !role) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    if (role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can access the reference letter" }, { status: 403 });
    }

    const row = await prisma.universityReferenceLetter.findUnique({
      where: { id: GLOBAL_ID },
    });

    return NextResponse.json(
      {
        message: "Reference letter template status retrieved",
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
    console.error("Get reference letter error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
