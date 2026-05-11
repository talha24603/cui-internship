"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type Internship = { id: string; student?: { name: string; regNo?: string | null } | null };
type FinalizationData = {
  internship: { id: string; student?: { name: string; regNo?: string | null } | null };
  marks: { facultyMarks: number | null; siteMarks: number | null; officeMarks: number | null; totalPreview: number; statusPreview: string };
  finalization: { isFinalizedByFaculty: boolean; finalizedAt?: string | null };
};

export default function FacultyFinalizationPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [data, setData] = useState<FinalizationData | null>(null);
  const [facultyMarks, setFacultyMarks] = useState("0");
  const [siteMarks, setSiteMarks] = useState("0");
  const [officeMarks, setOfficeMarks] = useState("0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [finalizing, setFinalizing] = useState(false);

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
    authJson<{ data: FinalizationData }>(`/api/faculty/finalization?internshipId=${internshipId}`)
      .then((res) => {
        setData(res.data);
        setFacultyMarks(String(res.data.marks.facultyMarks ?? 0));
        setSiteMarks(String(res.data.marks.siteMarks ?? 0));
        setOfficeMarks(String(res.data.marks.officeMarks ?? 0));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load finalization data"));
  }, [internshipId]);

  async function finalize() {
    setMessage("");
    setError("");
    setFinalizing(true);
    try {
      const res = await authJson<{ message: string }>("/api/faculty/finalization", {
        method: "POST",
        body: JSON.stringify({
          internshipId,
          facultyMarks: Number(facultyMarks),
          siteMarks: Number(siteMarks),
          officeMarks: Number(officeMarks),
        }),
      });
      setMessage(res.message);
      const refreshed = await authJson<{ data: FinalizationData }>(`/api/faculty/finalization?internshipId=${internshipId}`);
      setData(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finalize result");
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <FacultyShell title="Finalization" description="Finalize student final result after marks verification.">
      <Card>
        <div className="mb-3 max-w-md">
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div><p className="mb-1 text-sm">Faculty</p><Input type="number" min={0} max={40} value={facultyMarks} onChange={(e) => setFacultyMarks(e.target.value)} /></div>
          <div><p className="mb-1 text-sm">Site</p><Input type="number" min={0} max={40} value={siteMarks} onChange={(e) => setSiteMarks(e.target.value)} /></div>
          <div><p className="mb-1 text-sm">Office</p><Input type="number" min={0} max={20} value={officeMarks} onChange={(e) => setOfficeMarks(e.target.value)} /></div>
        </div>
        <Button
          className="mt-3"
          onClick={finalize}
          loading={finalizing}
          loadingText="Finalizing…"
        >
          Finalize Result
        </Button>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      {data ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm">Preview Total: {data.marks.totalPreview}</p>
            <div className="mt-2"><StatusBadge status={data.marks.statusPreview} /></div>
          </Card>
          <Card>
            <p className="text-sm">Finalized: {data.finalization.isFinalizedByFaculty ? "Yes" : "No"}</p>
            <p className="text-xs text-slate-500">
              {data.finalization.finalizedAt ? new Date(data.finalization.finalizedAt).toLocaleString() : "Not finalized yet"}
            </p>
          </Card>
        </div>
      ) : null}
    </FacultyShell>
  );
}
