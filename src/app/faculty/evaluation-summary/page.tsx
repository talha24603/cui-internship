"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authJson } from "@/utils/authClient";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Internship = {
  id: string;
  endDate?: string | null;
  student?: { name: string; regNo?: string | null } | null;
};

function buildFacultyInternshipsUrl(endDateFrom: string, endDateTo: string) {
  const p = new URLSearchParams();
  const ef = endDateFrom.trim();
  const et = endDateTo.trim();
  if (ef) p.set("endDateFrom", ef);
  if (et) p.set("endDateTo", et);
  const qs = p.toString();
  return qs ? `/api/faculty/internships?${qs}` : "/api/faculty/internships";
}

function internshipOptionLabel(item: Internship) {
  const name = item.student?.name ?? "Unknown";
  const reg = item.student?.regNo ?? "N/A";
  const end = item.endDate ? item.endDate.slice(0, 10) : "—";
  return `${name} (${reg}) — ends ${end}`;
}
type Summary = {
  facultyMarks: number | null;
  siteMarks: number | null;
  officeMarks: number | null;
  totalMarks: number | null;
  status: string | null;
};

export default function FacultyEvaluationSummaryPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [marks, setMarks] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [endDateFrom, setEndDateFrom] = useState("");
  const [endDateTo, setEndDateTo] = useState("");
  const debouncedEndFrom = useDebouncedValue(endDateFrom, 400);
  const debouncedEndTo = useDebouncedValue(endDateTo, 400);

  useEffect(() => {
    authJson<{ data: Internship[] }>(buildFacultyInternshipsUrl(debouncedEndFrom, debouncedEndTo))
      .then((res) => {
        const list = res.data ?? [];
        setInternships(list);
        setInternshipId((prev) => {
          if (prev && list.some((i) => i.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, [debouncedEndFrom, debouncedEndTo]);

  useEffect(() => {
    if (!internshipId) return;
    authJson<{ evaluationSummary: Summary }>(`/api/faculty/evaluation-summary?internshipId=${internshipId}`)
      .then((res) => setSummary(res.evaluationSummary))
      .catch(() => setSummary(null));
  }, [internshipId, message]);

  async function submitMarks() {
    setMessage("");
    setError("");
    setSaving(true);
    try {
      const res = await authJson<{ message: string }>("/api/faculty/evaluation-summary", {
        method: "POST",
        body: JSON.stringify({ internshipId, marks: Number(marks) }),
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit marks");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FacultyShell title="Evaluation Summary" description="Submit faculty marks and monitor total outcome.">
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <FormField label="Filter: internship ends on or after" hint="Optional (YYYY-MM-DD)">
            <Input type="date" value={endDateFrom} onChange={(e) => setEndDateFrom(e.target.value)} />
          </FormField>
          <FormField label="Filter: internship ends on or before" hint="Optional (YYYY-MM-DD)">
            <Input type="date" value={endDateTo} onChange={(e) => setEndDateTo(e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px] sm:items-end">
          <div>
            <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">Internship</p>
            <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
              <option value="">Select internship</option>
              {internships.map((item) => (
                <option key={item.id} value={item.id}>
                  {internshipOptionLabel(item)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">Faculty Marks (0-40)</p>
            <Input type="number" min={0} max={40} value={marks} onChange={(e) => setMarks(e.target.value)} />
          </div>
          <Button onClick={submitMarks} loading={saving} loadingText="Saving…">
            Save Marks
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      {summary ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card><p className="text-sm font-medium">Faculty: {summary.facultyMarks ?? "N/A"}</p></Card>
          <Card><p className="text-sm font-medium">Site: {summary.siteMarks ?? "N/A"}</p></Card>
          <Card><p className="text-sm font-medium">Office: {summary.officeMarks ?? "N/A"}</p></Card>
          <Card>
            <p className="text-sm font-medium">Total: {summary.totalMarks ?? "N/A"}</p>
            {summary.status ? <div className="mt-2"><StatusBadge status={summary.status} /></div> : null}
          </Card>
        </div>
      ) : null}
    </FacultyShell>
  );
}
