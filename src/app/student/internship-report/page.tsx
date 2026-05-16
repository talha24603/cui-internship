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

type CertificateState = {
  fileUrl: string;
  fileName: string | null;
  submittedAt: string;
};

export default function InternshipReportPage() {
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [report, setReport] = useState<ExistingReport | null>(null);
  const [certificate, setCertificate] = useState<CertificateState | null>(null);
  const [canSubmitCert, setCanSubmitCert] = useState(false);
  const [message, setMessage] = useState("");
  const [certMessage, setCertMessage] = useState("");
  const [error, setError] = useState("");
  const [certError, setCertError] = useState("");
  const [loading, setLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);

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
      .then((res) => {
        setReport(res.report);
        setSummary(res.report?.summary ?? "");
      })
      .catch(() => setReport(null));
  }, [internshipId]);

  useEffect(() => {
    if (!internshipId) return;
    authJson<{
      certificate: CertificateState | null;
      internship: { canSubmit: boolean };
    }>(`/api/student/internship-certificate?internshipId=${internshipId}`)
      .then((res) => {
        setCertificate(res.certificate);
        setCanSubmitCert(res.internship?.canSubmit ?? false);
      })
      .catch(() => {
        setCertificate(null);
        setCanSubmitCert(false);
      });
  }, [internshipId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!internshipId) throw new Error("Please select internship");
      if (!report && !file) throw new Error("Please upload a PDF file for your first submission");

      const formData = new FormData();
      formData.append("internshipId", internshipId);
      formData.append("summary", summary);
      if (file) formData.append("file", file);

      const response = await authFetch("/api/student/internship-report", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error || data.message || "Submission failed");
      setMessage(data.message || "Saved successfully");
      setFile(null);
      const refreshed = await authJson<{ report: ExistingReport | null }>(
        `/api/student/internship-report?internshipId=${internshipId}`
      );
      setReport(refreshed.report);
      setSummary(refreshed.report?.summary ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit report");
    } finally {
      setLoading(false);
    }
  }

  async function handleCertificateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCertLoading(true);
    setCertMessage("");
    setCertError("");

    try {
      if (!internshipId) throw new Error("Please select internship");
      if (!certFile) throw new Error("Please choose a certificate file");

      const formData = new FormData();
      formData.append("internshipId", internshipId);
      formData.append("file", certFile);

      const response = await authFetch("/api/student/internship-certificate", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
        certificate?: CertificateState;
      };
      if (!response.ok) throw new Error(data.error || data.message || "Upload failed");
      setCertMessage(data.message || "Certificate uploaded");
      setCertFile(null);
      if (data.certificate) setCertificate(data.certificate);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "Unable to upload certificate");
    } finally {
      setCertLoading(false);
    }
  }

  const hasFinalReport = Boolean(report?.fileUrl);

  return (
    <StudentShell
      title="Final Report & Certificate"
      description="Submit your final internship report (PDF), upload your completion certificate after the internship ends, and update your submission whenever needed."
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <div id="final-report-section" className="scroll-mt-24">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Final report</h2>
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
            <FormField
              label="Summary"
              hint="Optional context for reviewers and AI evaluation. You can update this without uploading a new PDF."
            >
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Optional summary"
                className="min-h-24"
              />
            </FormField>
            <FormField
              label="Report PDF"
              hint={
                hasFinalReport
                  ? "Optional: upload a new PDF to replace your current report. Leave empty to update the summary only."
                  : "Required for your first submission. PDF only."
              }
            >
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </FormField>
            <Button type="submit" loading={loading} loadingText="Saving…">
              {hasFinalReport ? "Update final report" : "Upload final report"}
            </Button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Latest report</h2>
            {!report?.fileUrl ? (
              <p className="text-sm text-slate-600">No report uploaded yet.</p>
            ) : (
              <div className="space-y-2 text-sm text-slate-700">
                <p>Submitted: {report.submittedDate ? new Date(report.submittedDate).toLocaleString() : "N/A"}</p>
                <p>Summary: {report.summary || "N/A"}</p>
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-[#2541b2] hover:underline"
                >
                  Open uploaded PDF
                </a>
              </div>
            )}
          </Card>

          <div id="internship-certificate-section" className="scroll-mt-24">
          <Card>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Internship certificate
            </h2>
            <p className="mb-3 text-sm text-slate-600">
              After your internship is completed (or the end date has passed), upload your internship completion
              certificate (PDF or clear scan as PNG/JPEG/WebP).
            </p>
            {!canSubmitCert ? (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Certificate upload unlocks when your internship is marked completed or after the scheduled end date.
              </p>
            ) : (
              <form onSubmit={handleCertificateSubmit} className="space-y-3">
                <FormField label="Certificate file">
                  <Input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                  />
                </FormField>
                <Button type="submit" loading={certLoading} loadingText="Uploading…">
                  {certificate ? "Replace certificate" : "Upload certificate"}
                </Button>
              </form>
            )}
            {certificate?.fileUrl ? (
              <div className="mt-4 space-y-1 text-sm text-slate-700">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {certificate.fileName || "Certificate"}
                </p>
                <p className="text-xs text-slate-500">
                  Uploaded {new Date(certificate.submittedAt).toLocaleString()}
                </p>
                <a
                  href={certificate.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-[#2541b2] hover:underline"
                >
                  View certificate
                </a>
              </div>
            ) : null}
            {certMessage ? <p className="mt-3 text-sm text-emerald-700">{certMessage}</p> : null}
            {certError ? <p className="mt-3 text-sm text-rose-700">{certError}</p> : null}
          </Card>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
