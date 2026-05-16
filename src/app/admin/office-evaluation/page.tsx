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
import { AdminRegNoSearch } from "@/components/admin/AdminRegNoSearch";
import { FormField } from "@/components/ui/form-field";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Internship = { id: string; endDate?: string | null; student?: { name: string; regNo?: string | null } | null };

function buildInternshipsListUrl(
  page: number,
  pageSize: number,
  opts: { regNo?: string; endDateFrom?: string; endDateTo?: string },
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const t = opts.regNo?.trim();
  if (t) params.set("regNo", t);
  const ef = opts.endDateFrom?.trim();
  if (ef) params.set("endDateFrom", ef);
  const et = opts.endDateTo?.trim();
  if (et) params.set("endDateTo", et);
  return `/api/admin/internships?${params.toString()}`;
}

async function fetchAllInternships(opts: {
  regNo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}): Promise<Internship[]> {
  const pageSize = 100;
  const first = await authJson<{ data: Internship[]; pagination?: AdminPagination }>(
    buildInternshipsListUrl(1, pageSize, opts),
  );
  let all: Internship[] = [...(first.data ?? [])];
  const totalPages = first.pagination?.totalPages ?? 1;
  for (let p = 2; p <= totalPages; p++) {
    const next = await authJson<{ data: Internship[] }>(buildInternshipsListUrl(p, pageSize, opts));
    all = all.concat(next.data ?? []);
  }
  return all;
}

function internshipOptionLabel(item: Internship) {
  const name = item.student?.name ?? "Unknown";
  const reg = item.student?.regNo ?? "N/A";
  const end = item.endDate ? item.endDate.slice(0, 10) : "—";
  return `${name} (${reg}) — ends ${end}`;
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
  const [regNoInput, setRegNoInput] = useState("");
  const debouncedRegNo = useDebouncedValue(regNoInput, 400);
  const [endDateFrom, setEndDateFrom] = useState("");
  const [endDateTo, setEndDateTo] = useState("");
  const debouncedEndFrom = useDebouncedValue(endDateFrom, 400);
  const debouncedEndTo = useDebouncedValue(endDateTo, 400);
  const [listLoading, setListLoading] = useState(true);
  const [criteria, setCriteria] = useState<Record<string, number>>(
    Object.fromEntries(criteriaFields.map((f) => [f.key, 10]))
  );
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setListLoading(true);
    fetchAllInternships({
      regNo: debouncedRegNo,
      endDateFrom: debouncedEndFrom,
      endDateTo: debouncedEndTo,
    })
      .then((all) => {
        setInternships(all);
        setInternshipId((prev) => {
          if (prev && all.some((i) => i.id === prev)) return prev;
          return all[0]?.id ?? "";
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"))
      .finally(() => setListLoading(false));
  }, [debouncedRegNo, debouncedEndFrom, debouncedEndTo]);

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
          <AdminRegNoSearch id="admin-office-eval-reg-no" value={regNoInput} onChange={setRegNoInput} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Internship ends on or after" hint="Optional (YYYY-MM-DD)">
              <Input type="date" value={endDateFrom} onChange={(e) => setEndDateFrom(e.target.value)} />
            </FormField>
            <FormField label="Internship ends on or before" hint="Optional (YYYY-MM-DD)">
              <Input type="date" value={endDateTo} onChange={(e) => setEndDateTo(e.target.value)} />
            </FormField>
          </div>
          {listLoading ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading internships…</p>
          ) : null}
          <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)} disabled={listLoading}>
            <option value="">Select internship</option>
            {internships.map((item) => (
              <option key={item.id} value={item.id}>
                {internshipOptionLabel(item)}
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
