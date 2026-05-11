"use client";

import { FormEvent, useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card } from "@/components/student/StudentUi";
import { authFetch, authJson } from "@/utils/authClient";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InternshipItem = { id: string; type: string; status: string };
type ExistingReport = { id: string; fileUrl?: string | null; summary?: string | null; submittedDate?: string };

export default function InternshipReportPage() {
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ExistingReport | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authJson<{ data: InternshipItem[] }>("/api/student/internships")
      .then((res) => {
        setInternships(res.data ?? []);
        if (res.data?.[0]?.id) setInternshipId(res.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, []);

  useEffect(() => {
    if (!internshipId) return;
    authJson<{ report: ExistingReport | null }>(`/api/student/internship-report?internshipId=${internshipId}`)
      .then((res) => setReport(res.report))
      .catch(() => setReport(null));
  }, [internshipId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!internshipId) throw new Error("Please select internship");
      if (!file) throw new Error("Please upload a PDF file");
      const formData = new FormData();
      formData.append("internshipId", internshipId);
      formData.append("summary", summary);
      formData.append("file", file);

      const response = await authFetch("/api/student/internship-report", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error || data.message || "Submission failed");
      setMessage(data.message || "Report submitted");
      const refreshed = await authJson<{ report: ExistingReport | null }>(
        `/api/student/internship-report?internshipId=${internshipId}`
      );
      setReport(refreshed.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell title="Final Internship Report" description="Upload final PDF report after internship completion.">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Submit Report</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <FormField label="Internship">
              <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
                <option value="">Select internship</option>
                {internships.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.type} - {item.status}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Summary" hint="Optional but recommended for context.">
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Optional summary"
                className="min-h-24"
              />
            </FormField>
            <FormField label="Report PDF" hint="Only PDF file is accepted.">
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </FormField>
            <Button type="submit" loading={loading} loadingText="Uploading…">
              Upload Final Report
            </Button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Latest Submission</h2>
          {!report ? (
            <p className="text-sm text-slate-600">No report uploaded yet.</p>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              <p>Submitted: {report.submittedDate ? new Date(report.submittedDate).toLocaleString() : "N/A"}</p>
              <p>Summary: {report.summary || "N/A"}</p>
              {report.fileUrl ? (
                <a href={report.fileUrl} target="_blank" rel="noreferrer" className="text-[#2541b2] hover:underline">
                  Open uploaded PDF
                </a>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </StudentShell>
  );
}
