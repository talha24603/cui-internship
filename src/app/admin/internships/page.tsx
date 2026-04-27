"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Internship = {
  id: string;
  type: string;
  status: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
  faculty?: { name: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

export default function AdminInternshipsPage() {
  const [items, setItems] = useState<Internship[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authJson<{ data: Internship[] }>("/api/admin/internships")
      .then((res) => setItems(res.data ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Internships" description="View all internship records across the system.">
      {error ? <PageError message={error} className="mb-3" /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => <Skeleton key={`internship-skeleton-${idx}`} className="h-28 w-full" />)
          : null}
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
              Faculty: {item.faculty?.name ?? "N/A"} | Site: {item.site?.name ?? "N/A"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Company: {item.site?.company?.name ?? "N/A"}</p>
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/internships/${item.id}`}>Open details</Link>
              </Button>
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 ? <PageEmpty message="No internships found." /> : null}
      </div>
    </AdminShell>
  );
}
