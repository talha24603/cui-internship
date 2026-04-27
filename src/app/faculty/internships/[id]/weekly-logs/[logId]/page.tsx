"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card } from "@/components/student/StudentUi";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type InternshipDetails = {
  id: string;
  student?: { name: string; regNo?: string | null } | null;
  weeklyLogs: Array<{
    id: string;
    weekNo: number;
    activitiesDone: string;
    skillsLearned: string;
    challenges: string;
    submittedDate: string;
  }>;
};

export default function FacultyWeeklyLogDetailPage() {
  const params = useParams<{ id: string; logId: string }>();
  const internshipId = params?.id ?? "";
  const logId = params?.logId ?? "";
  const [data, setData] = useState<InternshipDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!internshipId) return;
    authJson<{ data: InternshipDetails }>(`/api/faculty/internships/${internshipId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load weekly log"));
  }, [internshipId]);

  const selected = data?.weeklyLogs.find((item) => item.id === logId) ?? null;

  return (
    <FacultyShell title="Weekly Log Detail" description="Read weekly log on a dedicated full page.">
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/faculty/internships/${internshipId}`}>Back to internship details</Link>
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

      {!selected ? (
        <p className="text-sm text-slate-600">Weekly log not found.</p>
      ) : (
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {data?.student?.name ?? "Student"} ({data?.student?.regNo ?? "N/A"}) - Week {selected.weekNo}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Submitted: {new Date(selected.submittedDate).toLocaleString()}</p>

          <div className="mt-4 space-y-4 text-sm">
            <section>
              <h3 className="font-semibold">Activities Done</h3>
              <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selected.activitiesDone}</p>
            </section>
            <section>
              <h3 className="font-semibold">Skills Learned</h3>
              <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selected.skillsLearned}</p>
            </section>
            <section>
              <h3 className="font-semibold">Challenges</h3>
              <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selected.challenges}</p>
            </section>
          </div>
        </Card>
      )}
    </FacultyShell>
  );
}
