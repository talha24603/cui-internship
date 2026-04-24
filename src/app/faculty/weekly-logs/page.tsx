"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { authJson } from "@/utils/authClient";

type InternshipRecord = {
  internship: {
    id: string;
    type: string;
    status: string;
    student?: { name: string; regNo?: string | null; email: string } | null;
  };
  weeklyLogs: Array<{
    id: string;
    weekNo: number;
    activitiesDone: string;
    skillsLearned: string;
    challenges: string;
  }>;
};

type Internship = { id: string; student?: { name: string; regNo?: string | null } | null };

export default function FacultyWeeklyLogsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipId, setInternshipId] = useState("");
  const [data, setData] = useState<InternshipRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    authJson<{ data: Internship[] }>("/api/faculty/internships")
      .then((res) => {
        setInternships(res.data ?? []);
        if (res.data?.[0]?.id) setInternshipId(res.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, []);

  useEffect(() => {
    const url = internshipId ? `/api/faculty/weekly-logs?internshipId=${internshipId}` : "/api/faculty/weekly-logs";
    authJson<{ data: InternshipRecord[] }>(url)
      .then((res) => setData(res.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load weekly logs"));
  }, [internshipId]);

  return (
    <FacultyShell title="Weekly Logs" description="Review weekly submissions for supervised students.">
      <div className="mb-4 max-w-md">
        <Select value={internshipId} onChange={(e) => setInternshipId(e.target.value)}>
          <option value="">All internships</option>
          {internships.map((item) => (
            <option key={item.id} value={item.id}>
              {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      <div className="space-y-4">
        {data.map((group) => (
          <Card key={group.internship.id}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {group.internship.student?.name ?? "Unknown"} ({group.internship.student?.regNo ?? "N/A"})
              </h3>
              <StatusBadge status={group.internship.status} />
            </div>
            <div className="space-y-2">
              {group.weeklyLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-sm font-semibold">Week {log.weekNo}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Activities: {log.activitiesDone}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Skills: {log.skillsLearned}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Challenges: {log.challenges}</p>
                </div>
              ))}
              {group.weeklyLogs.length === 0 ? <p className="text-sm text-slate-600">No logs submitted yet.</p> : null}
            </div>
          </Card>
        ))}
        {data.length === 0 ? <p className="text-sm text-slate-600">No weekly log data found.</p> : null}
      </div>
    </FacultyShell>
  );
}
