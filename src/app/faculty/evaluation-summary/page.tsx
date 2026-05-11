"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type Internship = { id: string; student?: { name: string; regNo?: string | null } | null };
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

  useEffect(() => {
    authJson<{ data: Internship[] }>("/api/faculty/internships")
      .then((res) => {
        setInternships(res.data ?? []);
        if (res.data?.[0]?.id) setInternshipId(res.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, []);

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
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px] sm:items-end">
          <div>
            <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">Internship</p>
            <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
              <option value="">Select internship</option>
              {internships.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
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
