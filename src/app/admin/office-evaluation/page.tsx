"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import type { AdminPagination } from "@/utils/adminPagination";

type Internship = { id: string; student?: { name: string; regNo?: string | null } | null };

async function fetchAllInternships(): Promise<Internship[]> {
  const pageSize = 100;
  const first = await authJson<{ data: Internship[]; pagination?: AdminPagination }>(
    `/api/admin/internships?page=1&pageSize=${pageSize}`,
  );
  let all: Internship[] = [...(first.data ?? [])];
  const totalPages = first.pagination?.totalPages ?? 1;
  for (let p = 2; p <= totalPages; p++) {
    const next = await authJson<{ data: Internship[] }>(
      `/api/admin/internships?page=${p}&pageSize=${pageSize}`,
    );
    all = all.concat(next.data ?? []);
  }
  return all;
}

const criteriaFields = [
  { key: "internshipReport", label: "Internship Report" },
  { key: "portfolioEvidence", label: "Portfolio Evidence" },
  { key: "timeManagement", label: "Time Management" },
  { key: "overallInternshipImpact", label: "Overall Internship Impact" },
] as const;

export default function AdminOfficeEvaluationPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [criteria, setCriteria] = useState<Record<string, number>>(
    Object.fromEntries(criteriaFields.map((f) => [f.key, 10]))
  );
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllInternships()
      .then((all) => {
        setInternships(all);
        setInternshipId((prev) => prev || all[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const res = await authJson<{ message: string }>("/api/admin/office-evaluation", {
        method: "POST",
        body: JSON.stringify({ internshipId, criteria, comments }),
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit office evaluation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell title="Office Evaluation" description="Submit placement office evaluation criteria for internships.">
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
            <option value="">Select internship</option>
            {internships.map((item) => (
              <option key={item.id} value={item.id}>
                {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
              </option>
            ))}
          </Select>

          <div className="grid gap-3 sm:grid-cols-2">
            {criteriaFields.map((field) => (
              <div key={field.key}>
                <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">{field.label} (3/5/8/10)</p>
                <Input
                  type="number"
                  min={3}
                  max={10}
                  step={1}
                  value={criteria[field.key]}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments (optional)" />
          <Button type="submit" loading={submitting} loadingText="Submitting…">
            Submit Office Evaluation
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </AdminShell>
  );
}
