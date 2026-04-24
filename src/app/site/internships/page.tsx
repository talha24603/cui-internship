"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/components/site/SiteShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type Internship = {
  id: string;
  type: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  student?: { name: string; regNo?: string | null; email: string } | null;
  faculty?: { name: string } | null;
  site?: { company?: { name: string } | null } | null;
};

export default function SiteInternshipsPage() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<Internship[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    authJson<{ data: Internship[] }>(`/api/site/internships?status=${status}`)
      .then((res) => setItems(res.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"));
  }, [status]);

  return (
    <SiteShell title="Internships" description="View internships where you are assigned as site supervisor.">
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
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
              </h3>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.type} | {item.student?.email}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Faculty: {item.faculty?.name ?? "N/A"} | Company: {item.site?.company?.name ?? "N/A"}
            </p>
            <p className="text-xs text-slate-500">
              {item.startDate ? new Date(item.startDate).toLocaleDateString() : "N/A"} -{" "}
              {item.endDate ? new Date(item.endDate).toLocaleDateString() : "N/A"}
            </p>
          </Card>
        ))}
        {items.length === 0 ? <PageEmpty message="No internships found." /> : null}
      </div>
    </SiteShell>
  );
}
