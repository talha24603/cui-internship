"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type AppexA = {
  id: string;
  organization: string;
  address: string;
  industrySector: string;
  contactName: string;
  contactDesignation: string;
  contactPhone: string;
  contactEmail: string;
  internshipNature: string;
  internshipLocation: string;
  mode: string;
  numberOfInternship: string;
  status: string;
  startDate: string;
  endDate: string;
  workingDays: string;
  workingHours: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
};

export default function AdminAppexAPage() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState<AppexA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<AppexA | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const query = status === "all" ? "" : `?status=${status.toLowerCase()}`;
      const res = await authJson<{ data: AppexA[] }>(`/api/admin/appex-a${query}`);
      setItems(res.data ?? []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Unable to load AppEx A submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSuccess("");
    void load();
  }, [status]);

  async function update(appexAId: string, nextStatus: "approved" | "rejected") {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      const res = await authJson<{ message: string }>("/api/admin/appex-a", {
        method: "PATCH",
        body: JSON.stringify({ appexAId, status: nextStatus }),
      });
      setSuccess(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update AppEx A");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AdminShell title="AppEx A" description="Approve or reject AppEx A forms and sync internship dates.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="all">All</option>
        </Select>
      </div>
      {error ? <PageError message={error} className="mb-3" /> : null}
      {success ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </p>
      ) : null}
      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        ) : (
          <>
            {items.map((item) => (
              <Card key={item.id} className="cursor-pointer transition hover:shadow-md" onClick={() => setSelected(item)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.student?.email}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                </p>
                <p className="mt-1 text-xs font-medium text-[#2541b2]">Click to view full details</p>
              </Card>
            ))}
            {items.length === 0 ? <PageEmpty message="No AppEx A submissions found." /> : null}
          </>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {selected.student?.name ?? "Unknown"} ({selected.student?.regNo ?? "N/A"})
              </h3>
              <StatusBadge status={selected.status} />
            </div>
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 sm:grid-cols-2">
              <p><span className="font-semibold">Email:</span> {selected.student?.email ?? "N/A"}</p>
              <p><span className="font-semibold">Organization:</span> {selected.organization}</p>
              <p><span className="font-semibold">Industry Sector:</span> {selected.industrySector}</p>
              <p><span className="font-semibold">Address:</span> {selected.address}</p>
              <p><span className="font-semibold">Location:</span> {selected.internshipLocation}</p>
              <p><span className="font-semibold">Nature:</span> {selected.internshipNature}</p>
              <p><span className="font-semibold">Mode:</span> {selected.mode}</p>
              <p><span className="font-semibold">No. of Internships:</span> {selected.numberOfInternship}</p>
              <p><span className="font-semibold">Start Date:</span> {new Date(selected.startDate).toLocaleDateString()}</p>
              <p><span className="font-semibold">End Date:</span> {new Date(selected.endDate).toLocaleDateString()}</p>
              <p><span className="font-semibold">Working Days:</span> {selected.workingDays}</p>
              <p><span className="font-semibold">Working Hours:</span> {selected.workingHours}</p>
              <p><span className="font-semibold">Contact Name:</span> {selected.contactName}</p>
              <p><span className="font-semibold">Contact Designation:</span> {selected.contactDesignation}</p>
              <p><span className="font-semibold">Contact Phone:</span> {selected.contactPhone}</p>
              <p className="sm:col-span-2"><span className="font-semibold">Contact Email:</span> {selected.contactEmail}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status === "PENDING" ? (
                <>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() =>
                      update(selected.id, "approved").then(() => setSelected(null))
                    }
                  >
                    {actionLoading ? "Saving…" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() =>
                      update(selected.id, "rejected").then(() => setSelected(null))
                    }
                  >
                    {actionLoading ? "Saving…" : "Reject"}
                  </Button>
                </>
              ) : null}
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
