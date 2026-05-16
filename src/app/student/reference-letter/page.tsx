"use client";

import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card } from "@/components/student/StudentUi";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type ReferenceLetter = {
  fileUrl: string;
  fileName: string | null;
  updatedAt: string | null;
};

export default function ReferenceLetterPage() {
  const [letter, setLetter] = useState<ReferenceLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authJson<{ referenceLetter: ReferenceLetter | null }>("/api/student/reference-letter")
      .then((res) => setLetter(res.referenceLetter))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load reference letter"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentShell
      title="University Reference Letter"
      description="Shared Word template for all students. Download and customize it on your computer—you do not need an active internship to use this."
    >
      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {!loading && !error ? (
        <Card>
          {!letter?.fileUrl ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p>The placement office has not published the reference letter template yet.</p>
              <p className="text-slate-500">Check back later or contact the placement office.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This is the same document for every student. Open it in Microsoft Word, fill in your details, and save
                your own copy.
              </p>
              <div className="text-sm text-slate-700">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {letter.fileName || "University reference letter template"}
                </p>
                {letter.updatedAt ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Template last updated {new Date(letter.updatedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <Button asChild>
                <a href={letter.fileUrl} download={letter.fileName || undefined} target="_blank" rel="noreferrer">
                  Download template
                </a>
              </Button>
              <p className="text-xs text-slate-500">
                Opens in a new tab; use your browser&apos;s save option if the download does not start automatically.
              </p>
            </div>
          )}
        </Card>
      ) : null}
    </StudentShell>
  );
}
