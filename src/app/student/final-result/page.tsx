"use client";

import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { Award, BadgeCheck, ClipboardCheck, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type FinalResultResponse = {
  message: string;
  finalResult: {
    total?: number;
    totalMarks?: number;
    grade?: string;
    status?: string;
    isFinalizedByFaculty?: boolean;
    [key: string]: unknown;
  } | null;
  internship?: {
    id: string;
    type: string;
    status: string;
    faculty?: { name: string } | null;
    site?: { name: string } | null;
  };
};

export default function FinalResultPage() {
  const [data, setData] = useState<FinalResultResponse | null>(null);
  const [error, setError] = useState("");
  const total = data?.finalResult?.total ?? data?.finalResult?.totalMarks;
  const grade = data?.finalResult?.grade ?? data?.finalResult?.status;

  useEffect(() => {
    authJson<FinalResultResponse>("/api/student/final-result")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load final result"));
  }, []);

  return (
    <StudentShell title="Final Result" description="View finalized internship marks and outcome.">
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Internship</p>
            <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{data.internship?.type ?? "N/A"}</p>
            <div className="mt-2">{data.internship?.status ? <StatusBadge status={data.internship.status} /> : null}</div>
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Faculty / Site</p>
            <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {data.internship?.faculty?.name ?? "N/A"} / {data.internship?.site?.name ?? "N/A"}
            </p>
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
              <GraduationCap className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Grade</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{grade ?? "Pending"}</p>
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <Award className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Marks</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {total ?? "Pending"}
            </p>
          </Card>
        </div>
      )}
    </StudentShell>
  );
}
