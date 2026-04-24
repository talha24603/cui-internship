"use client";

import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, LabelValue, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { Building2, CalendarRange, Fingerprint, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Internship = {
  id: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  faculty?: { name: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

export default function StudentOverviewPage() {
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const result = await authJson<{ data: Internship[] }>("/api/student/internships");
        setInternship(result.data?.[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <StudentShell
      title="Student Overview"
      description="Your internship progress and key details at a glance."
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {!loading && !error && !internship ? (
        <Card>
          <p className="text-sm text-slate-700">
            No internship found yet. Start from the Internship section to create your internship
            request.
          </p>
        </Card>
      ) : null}

      {internship ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <Fingerprint className="h-4 w-4" />
            </div>
            <LabelValue label="Internship Type" value={internship.type} />
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <LabelValue label="Status" value={<StatusBadge status={internship.status} />} />
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              <CalendarRange className="h-4 w-4" />
            </div>
            <LabelValue
              label="Duration"
              value={`${internship.startDate ? new Date(internship.startDate).toLocaleDateString() : "N/A"} - ${
                internship.endDate ? new Date(internship.endDate).toLocaleDateString() : "N/A"
              }`}
            />
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
              <Users className="h-4 w-4" />
            </div>
            <LabelValue
              label="Assigned Supervisors"
              value={`Faculty: ${internship.faculty?.name ?? "Not assigned"} | Site: ${internship.site?.name ?? "Not assigned"}`}
            />
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <Building2 className="h-4 w-4" />
            </div>
            <LabelValue label="Company" value={internship.site?.company?.name ?? "Not assigned"} />
          </Card>
          <Card>
            <div className="mb-3 inline-flex rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
              <UserRoundCheck className="h-4 w-4" />
            </div>
            <LabelValue label="Internship ID" value={internship.id} />
          </Card>
        </div>
      ) : null}
    </StudentShell>
  );
}
