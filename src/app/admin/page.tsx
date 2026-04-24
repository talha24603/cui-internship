"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, LabelValue } from "@/components/student/StudentUi";
import { Skeleton } from "@/components/ui/skeleton";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type Internship = { id: string; status: string };
type CompanyRequest = { id: string; status: string };
type Announcement = { id: string; title?: string | null; message: string };

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [internships, setInternships] = useState<Internship[]>([]);
  const [companyRequests, setCompanyRequests] = useState<CompanyRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    Promise.all([
      authJson<{ data: Internship[] }>("/api/admin/internships"),
      authJson<{ requests: CompanyRequest[] }>("/api/admin/review-company"),
      authJson<{ data: Announcement[] }>("/api/admin/announcements"),
    ])
      .then(([i, c, a]) => {
        setInternships(i.data ?? []);
        setCompanyRequests(c.requests ?? []);
        setAnnouncements((a.data ?? []).slice(0, 5));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load admin overview"))
      .finally(() => setLoading(false));
  }, []);

  const pendingInternships = internships.filter((i) => i.status === "PENDING").length;
  const pendingCompanies = companyRequests.filter((c) => c.status === "PENDING").length;

  return (
    <AdminShell title="Admin Overview" description="System-wide controls and monitoring dashboard.">
      {error ? <PageError message={error} className="mb-3" /> : null}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                <Users className="h-4 w-4" />
              </div>
              <LabelValue label="Total Internships" value={internships.length} />
            </Card>
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <Building2 className="h-4 w-4" />
              </div>
              <LabelValue label="Pending Company Requests" value={pendingCompanies} />
            </Card>
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                <Users className="h-4 w-4" />
              </div>
              <LabelValue label="Pending Internships" value={pendingInternships} />
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Bell className="h-4 w-4" />
              Recent Announcements
            </h2>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title || "Announcement"}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{a.message}</p>
                </div>
              ))}
              {announcements.length === 0 ? <PageEmpty message="No announcements found." /> : null}
            </div>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
