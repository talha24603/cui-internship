"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type Internship = {
  id: string;
  type: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  student?: { name: string; regNo?: string | null; email: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

export default function FacultyInternshipsPage() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    authJson<{ data: Internship[] }>(`/api/faculty/internships?status=${status}`)
      .then((res) => setItems(res.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <FacultyShell title="Internships" description="View students assigned to you and their internship progress.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {error ? <PageError message={error} className="mb-3" /> : null}
      {loading ? (
        <p className="text-sm text-slate-600">Loading internships...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
                </h3>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {item.type} | {item.student?.email}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Company: {item.site?.company?.name ?? "N/A"} | Site supervisor: {item.site?.name ?? "N/A"}
              </p>
              <p className="text-xs text-slate-500">
                {item.startDate ? new Date(item.startDate).toLocaleDateString() : "N/A"} -{" "}
                {item.endDate ? new Date(item.endDate).toLocaleDateString() : "N/A"}
              </p>
              <div className="mt-3">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/faculty/internships/${item.id}`}>Open details</Link>
                </Button>
              </div>
            </Card>
          ))}
          {items.length === 0 ? <PageEmpty message="No internships found." /> : null}
        </div>
      )}
    </FacultyShell>
  );
}
