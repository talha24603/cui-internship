"use client";

import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, LabelValue, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import {
  Building2,
  CalendarRange,
  Fingerprint,
  ScrollText,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import InternshipTimeline from "@/components/student/InternshipTimeline";
import type { TimelineItem } from "@/types/internship-timeline";

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
  const [referenceLetterUrl, setReferenceLetterUrl] = useState<string | null>(null);
  const [internshipError, setInternshipError] = useState("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineError, setTimelineError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setInternshipError("");

      const results = await Promise.allSettled([
        authJson<{ data: Internship[] }>("/api/student/internships"),
        authJson<{ referenceLetter: { fileUrl: string } | null }>("/api/student/reference-letter"),
        authJson<{ items: TimelineItem[] }>("/api/student/internship-timeline"),
      ]);

      if (cancelled) return;

      const [internshipsOut, letterOut, timelineOut] = results;

      if (internshipsOut.status === "fulfilled") {
        setInternship(internshipsOut.value.data?.[0] ?? null);
      } else {
        setInternship(null);
        const reason = internshipsOut.reason;
        setInternshipError(reason instanceof Error ? reason.message : "Unable to load internships");
      }

      if (letterOut.status === "fulfilled") {
        setReferenceLetterUrl(letterOut.value.referenceLetter?.fileUrl ?? null);
      } else {
        setReferenceLetterUrl(null);
      }

      if (timelineOut.status === "fulfilled") {
        setTimelineItems(timelineOut.value.items ?? []);
        setTimelineError("");
      } else {
        setTimelineItems([]);
        const reason = timelineOut.reason;
        setTimelineError(reason instanceof Error ? reason.message : "Unable to load timeline");
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StudentShell
      title="Student Overview"
      description="Your internship progress and shared university documents."
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {!loading ? (
        <div className="space-y-4">
          {internshipError ? <p className="text-sm text-rose-700">{internshipError}</p> : null}
          {timelineError ? <p className="text-sm text-rose-700">{timelineError}</p> : null}

          {timelineItems.length > 0 ? <InternshipTimeline items={timelineItems} /> : null}

          {referenceLetterUrl ? (
            <Card>
              <div className="mb-3 inline-flex rounded-lg bg-teal-100 p-2 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
                <ScrollText className="h-4 w-4" />
              </div>
              <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                University reference letter (template)
              </p>
              <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                Same Word template for everyone—download and fill in your own details. Does not require an internship.
              </p>
              <Link
                href="/student/reference-letter"
                className="text-sm font-medium text-[#2541b2] hover:underline"
              >
                Open reference letter page
              </Link>
            </Card>
          ) : null}

          {!internship && !internshipError ? (
            <Card>
              <p className="text-sm text-slate-700">
                No internship found yet. Submit AppEx A to initiate your internship workflow.
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
        </div>
      ) : null}
    </StudentShell>
  );
}
