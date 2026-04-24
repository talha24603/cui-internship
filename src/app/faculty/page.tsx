"use client";

import { useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, ClipboardCheck, FileSpreadsheet } from "lucide-react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, LabelValue, StatusBadge } from "@/components/student/StudentUi";
import { Skeleton } from "@/components/ui/skeleton";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type Internship = {
  id: string;
  type: string;
  status: string;
  student?: { name: string; regNo?: string | null } | null;
};

type ProfilePayload = {
  profile: {
    department: string;
    designation: string;
    user: { name: string; email: string };
  } | null;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
};

export default function FacultyOverviewPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [profile, setProfile] = useState<ProfilePayload["profile"]>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      authJson<{ data: Internship[] }>("/api/faculty/internships"),
      authJson<ProfilePayload>("/api/faculty/profile"),
      fetch("/api/announcements").then((r) => r.json() as Promise<{ data: Announcement[] }>),
    ])
      .then(([i, p, a]) => {
        setInternships(i.data ?? []);
        setProfile(p.profile ?? null);
        setAnnouncements((a.data ?? []).slice(0, 4));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load faculty overview"))
      .finally(() => setLoading(false));
  }, []);

  const approvedCount = internships.filter((i) => i.status === "APPROVED").length;
  const pendingCount = internships.filter((i) => i.status === "PENDING").length;

  return (
    <FacultyShell title="Faculty Overview" description="Manage supervised internships and evaluation workflows.">
      {error ? <PageError message={error} className="mb-3" /> : null}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full sm:col-span-2" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <LabelValue label="Supervised Internships" value={internships.length} />
            </Card>
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <StatusBadge status="PENDING" />
              </div>
              <LabelValue label="Pending" value={pendingCount} />
            </Card>
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <LabelValue label="Approved" value={approvedCount} />
            </Card>
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <LabelValue label="Department" value={profile?.department ?? "N/A"} />
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <Card>
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Recent Internships</h2>
              <div className="space-y-3">
                {internships.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.student?.name ?? "Unknown Student"} ({item.student?.regNo ?? "N/A"})
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Type: {item.type}</p>
                  </div>
                ))}
                {internships.length === 0 ? <PageEmpty message="No internships found." /> : null}
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                <Bell className="h-4 w-4" />
                Announcements
              </h2>
              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-slate-600 dark:text-slate-400">{item.body}</p>
                  </div>
                ))}
                {announcements.length === 0 ? <PageEmpty message="No announcements yet." /> : null}
              </div>
            </Card>
          </div>
        </div>
      )}
    </FacultyShell>
  );
}
