"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/student/StudentUi";
import { Button } from "@/components/ui/button";
import { authFetch, authJson } from "@/utils/authClient";

type LetterMeta = {
  fileUrl: string;
  fileName: string | null;
  updatedAt: string;
};

export default function AdminReferenceLetterPage() {
  const [letter, setLetter] = useState<LetterMeta | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    authJson<{ referenceLetter: LetterMeta | null }>("/api/admin/reference-letter")
      .then((res) => setLetter(res.referenceLetter))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await authFetch("/api/admin/reference-letter", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        message?: string;
        error?: string;
        referenceLetter?: LetterMeta;
      };
      if (!response.ok) throw new Error(body.error || body.message || "Upload failed");
      setMessage(body.message || "Saved");
      setFile(null);
      if (body.referenceLetter) setLetter(body.referenceLetter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminShell
      title="University reference letter"
      description="One Word template for every student. They download it here and edit it locally—nothing is tied to a specific internship."
    >
      {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}
      {error && !loading ? <p className="text-sm text-rose-700">{error}</p> : null}

      {!loading ? (
        <Card>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Upload a <strong>.doc</strong> or <strong>.docx</strong> file. All students see the same document in their
            portal under Reference Letter—whether or not they have started an internship.
          </p>

          {letter?.fileUrl ? (
            <div className="mb-4 space-y-1 text-sm">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Current template: {letter.fileName || "reference letter"}
              </p>
              <p className="text-xs text-slate-500">Updated {new Date(letter.updatedAt).toLocaleString()}</p>
              <Button asChild variant="outline" size="sm">
                <a href={letter.fileUrl} target="_blank" rel="noreferrer">
                  Preview / download
                </a>
              </Button>
            </div>
          ) : (
            <p className="mb-4 text-sm text-amber-800 dark:text-amber-200">
              No template published yet—students will see an empty state until you upload one.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm dark:text-slate-300 dark:file:border-slate-600 dark:file:bg-slate-900"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Uploading…" : letter ? "Replace template" : "Upload template"}
            </Button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        </Card>
      ) : null}
    </AdminShell>
  );
}
