"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type WeeklyLog = {
  id: string;
  weekNo: number;
  activitiesDone: string;
  skillsLearned: string;
  challenges: string;
  submittedDate: string;
};

type InternshipReport = {
  id: string;
  type: string;
  fileUrl: string;
  summary?: string | null;
  submittedDate: string;
};

type Evaluation = {
  id: string;
  type: string;
  marks: number;
  comments?: string | null;
  details?: unknown;
  submittedDate: string;
};

type InternshipDetails = {
  id: string;
  type: string;
  status: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
  faculty?: { name: string; email: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
  weeklyLogs: WeeklyLog[];
  reports: InternshipReport[];
  evaluations: Evaluation[];
};

export default function AdminInternshipDetailPage() {
  const params = useParams<{ id: string }>();
  const internshipId = params?.id ?? "";
  const [data, setData] = useState<InternshipDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!internshipId) return;
    setLoading(true);
    authJson<{ data: InternshipDetails }>(`/api/admin/internships/${internshipId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internship details"))
      .finally(() => setLoading(false));
  }, [internshipId]);

  const finalReport = useMemo(
    () => data?.reports.find((item) => item.type.toLowerCase() === "final") ?? null,
    [data],
  );

  const aiReportEvaluation = useMemo(
    () => data?.evaluations.find((item) => item.type === "ai_report_review") ?? null,
    [data],
  );

  const aiSummary = useMemo(() => {
    const details = aiReportEvaluation?.details;
    if (!details || typeof details !== "object") return null;
    const assessment = (details as { assessment?: { summary?: string } }).assessment;
    return assessment?.summary ?? null;
  }, [aiReportEvaluation]);

  return (
    <AdminShell title="Internship Details" description="Read weekly logs and final report evaluation in full view.">
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/internships">Back to internships</Link>
        </Button>
      </div>

      {loading ? <p className="text-sm text-slate-600">Loading details...</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {data ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {data.student?.name ?? "Unknown"} ({data.student?.regNo ?? "N/A"})
              </h2>
              <StatusBadge status={data.status} />
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{data.type}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Faculty: {data.faculty?.name ?? "N/A"} | Site: {data.site?.name ?? "N/A"} | Company:{" "}
              {data.site?.company?.name ?? "N/A"}
            </p>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold">Weekly Logs</h3>
            <div className="space-y-2">
              {data.weeklyLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Week {log.weekNo}</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/internships/${internshipId}/weekly-logs/${log.id}`}>Open full page</Link>
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(log.submittedDate).toLocaleString()}</p>
                </div>
              ))}
              {data.weeklyLogs.length === 0 ? <p className="text-sm text-slate-600">No weekly logs submitted yet.</p> : null}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold">Final Report</h3>
            {!finalReport ? (
              <p className="text-sm text-slate-600">Final report not uploaded yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p>Submitted: {new Date(finalReport.submittedDate).toLocaleString()}</p>
                <p>Summary: {finalReport.summary || "N/A"}</p>
                <Button asChild size="sm">
                  <a href={finalReport.fileUrl} target="_blank" rel="noreferrer">
                    Download Final Report
                  </a>
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold">AI Evaluation (Final Report)</h3>
            {!aiReportEvaluation ? (
              <p className="text-sm text-slate-600">AI evaluation not available yet.</p>
            ) : (
              <div className="space-y-1 text-sm">
                <p>AI Marks: {aiReportEvaluation.marks}</p>
                <p>Comments: {aiReportEvaluation.comments || "N/A"}</p>
                <p>Assessment: {aiSummary || "N/A"}</p>
                <p className="text-xs text-slate-500">
                  Generated: {new Date(aiReportEvaluation.submittedDate).toLocaleString()}
                </p>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </AdminShell>
  );
}
