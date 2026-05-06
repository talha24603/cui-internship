"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ListChecks } from "lucide-react";

type InternshipRecord = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  faculty?: { name: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

export default function StudentInternshipsPage() {
  const [internships, setInternships] = useState<InternshipRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    const internshipsRes = await authJson<{ data: InternshipRecord[] }>("/api/student/internships");
    setInternships(internshipsRes.data ?? []);
    setInitialLoading(false);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err instanceof Error ? err.message : "Unable to load data"));
  }, []);

  return (
    <StudentShell
      title="Internship Management"
      description="Track your internship record and approval status."
    >
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex rounded-md bg-sky-100 p-1.5 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              <FileText className="h-4 w-4" />
            </span>
            New Workflow
          </h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            Internship records are now created automatically when you submit AppEx A.
            Start from AppEx A, then track status here.
          </p>
          <Button asChild>
            <Link href="/student/appex-a">
              Go to AppEx A
            </Link>
          </Button>
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Supervisor assignment is handled later through AppEx B verification.
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-flex rounded-md bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <ListChecks className="h-4 w-4" />
            </span>
            Your Requests
          </h2>
          <div className="space-y-3">
            {initialLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : internships.length === 0 ? (
              <p className="text-sm text-slate-600">No internship requests yet.</p>
            ) : (
              internships.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.type}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Faculty: {item.faculty?.name ?? "Not assigned"} | Site: {item.site?.name ?? "Not assigned"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
