"use client";

import { FormEvent, useEffect, useState } from "react";
import SiteShell from "@/components/site/SiteShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import { PageError, PageEmpty } from "@/components/shared/page-state";

type Internship = {
  id: string;
  student?: { name: string; regNo?: string | null } | null;
  status: string;
};

type Evaluation = {
  id: string;
  type: string;
  marks: number;
  comments?: string | null;
  submittedDate: string;
};

const criteriaFields = [
  { key: "punctualityAttendance", label: "Punctuality & Attendance" },
  { key: "linkTheoryToPractice", label: "Link Theory to Practice" },
  { key: "criticalThinking", label: "Critical Thinking" },
  { key: "technicalKnowledge", label: "Technical Knowledge" },
  { key: "creativity", label: "Creativity" },
  { key: "adaptability", label: "Adaptability" },
  { key: "timeManagement", label: "Time Management" },
  { key: "professionalBehavior", label: "Professional Behavior" },
  { key: "assignmentsPerformance", label: "Assignments Performance" },
  { key: "communicationSkills", label: "Communication Skills" },
] as const;

export default function SiteEvaluationsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [type, setType] = useState<"site_mid" | "site_final">("site_mid");
  const [comments, setComments] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [criteria, setCriteria] = useState<Record<string, number>>(
    Object.fromEntries(criteriaFields.map((f) => [f.key, 1]))
  );

  async function loadEvaluations(selectedInternshipId: string, selectedType?: string) {
    if (!selectedInternshipId) {
      setEvaluations([]);
      return;
    }
    const query = selectedType
      ? `/api/site/evaluations?internshipId=${selectedInternshipId}&type=${selectedType}`
      : `/api/site/evaluations?internshipId=${selectedInternshipId}`;
    const res = await authJson<{ evaluations: Evaluation[] }>(query);
    setEvaluations(res.evaluations ?? []);
  }

  useEffect(() => {
    authJson<{ data: Internship[] }>("/api/site/internships?status=approved")
      .then((res) => {
        setInternships(res.data ?? []);
        if (res.data?.[0]?.id) {
          setInternshipId(res.data[0].id);
          return loadEvaluations(res.data[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, []);

  useEffect(() => {
    if (!internshipId) return;
    loadEvaluations(internshipId, type).catch(() => undefined);
  }, [internshipId, type]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const totalMarks = Object.values(criteria).reduce((sum, v) => sum + Number(v || 0), 0);
      const res = await authJson<{ message: string }>("/api/site/evaluations", {
        method: "POST",
        body: JSON.stringify({
          internshipId,
          type,
          criteria,
          comments,
          totalMarks,
        }),
      });
      setMessage(res.message);
      await loadEvaluations(internshipId, type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell title="Evaluations" description="Submit site mid/final evaluations for assigned interns.">
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
              <option value="">Select internship</option>
              {internships.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"}) - {item.status}
                </option>
              ))}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value as "site_mid" | "site_final")}>
              <option value="site_mid">site_mid</option>
              <option value="site_final">site_final</option>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {criteriaFields.map((field) => (
              <div key={field.key}>
                <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">{field.label} (1-4)</p>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  required
                  value={criteria[field.key]}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments (optional)" />
          <Button type="submit" loading={submitting} loadingText="Submitting…">
            Submit Evaluation
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <PageError message={error} className="mt-3" /> : null}
      </Card>

      <div className="mt-4 space-y-3">
        {evaluations.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.type}</p>
              <StatusBadge status={item.type} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Marks: {item.marks}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.comments || "No comments"}</p>
            <p className="text-xs text-slate-500">{new Date(item.submittedDate).toLocaleString()}</p>
          </Card>
        ))}
        {evaluations.length === 0 ? <PageEmpty message="No evaluations found for selected filters." /> : null}
      </div>
    </SiteShell>
  );
}
