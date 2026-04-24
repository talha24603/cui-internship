"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Users } from "lucide-react";
import SiteShell from "@/components/site/SiteShell";
import { Card, LabelValue, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { PageError } from "@/components/shared/page-state";

type Internship = {
  id: string;
  status: string;
  type: string;
  student?: { name: string; regNo?: string | null } | null;
};

type Evaluation = { id: string; type: string; marks: number };

export default function SiteOverviewPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    authJson<{ data: Internship[] }>("/api/site/internships")
      .then((res) => {
        setInternships(res.data ?? []);
        const firstInternship = res.data?.[0]?.id;
        if (!firstInternship) return;
        authJson<{ evaluations: Evaluation[] }>(`/api/site/evaluations?internshipId=${firstInternship}`)
          .then((ev) => setEvaluationCount(ev.evaluations?.length ?? 0))
          .catch(() => undefined);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load site overview"));
  }, []);

  const approved = internships.filter((i) => i.status === "APPROVED").length;

  return (
    <SiteShell title="Site Supervisor Overview" description="Manage assigned interns and submit evaluations.">
      {error ? <PageError message={error} className="mb-3" /> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            <Users className="h-4 w-4" />
          </div>
          <LabelValue label="Assigned Internships" value={internships.length} />
        </Card>
        <Card>
          <div className="mb-3 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <StatusBadge status="APPROVED" />
          </div>
          <LabelValue label="Approved" value={approved} />
        </Card>
        <Card>
          <div className="mb-3 inline-flex rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <LabelValue label="Evaluations Logged" value={evaluationCount} />
        </Card>
      </div>

      <div className="mt-5 space-y-3">
        {internships.slice(0, 5).map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.type}</p>
          </Card>
        ))}
      </div>
    </SiteShell>
  );
}
