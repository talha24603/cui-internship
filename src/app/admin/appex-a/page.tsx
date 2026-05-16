"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";
import type { AdminPagination } from "@/utils/adminPagination";
import { AdminPaginationBar } from "@/components/admin/AdminPaginationBar";
import { AdminRegNoSearch } from "@/components/admin/AdminRegNoSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

const PAGE_SIZE = 20;

export default function AdminAppexAPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [items, setItems] = useState<AppexA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<AppexA | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [regNoInput, setRegNoInput] = useState("");
  const debouncedRegNo = useDebouncedValue(regNoInput, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedRegNo]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status.toLowerCase());
      const reg = debouncedRegNo.trim();
      if (reg) params.set("regNo", reg);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const qs = params.toString();
      const res = await authJson<{ data: AppexA[]; pagination?: AdminPagination }>(
        `/api/admin/appex-a${qs ? `?${qs}` : ""}`,
      );
      setItems(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) {
      setItems([]);
      setPagination(null);
      setError(err instanceof Error ? err.message : "Unable to load AppEx A submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSuccess("");
    void load();
  }, [status, page, debouncedRegNo]);

  async function update(appexAId: string, nextStatus: "approved" | "rejected") {
    setError("");
    setSuccess("");
    setActionLoading(true);
    setPendingAction(nextStatus);
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
      setPendingAction(null);
    }
  }

  return (
    <AdminShell title="AppEx A" description="Approve or reject AppEx A forms and sync internship dates.">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="max-w-xs">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All</option>
          </Select>
        </div>
        <AdminRegNoSearch id="admin-appex-a-reg-no" value={regNoInput} onChange={setRegNoInput} />
      </div>
      {error ? <PageError message={error} className="mb-3" /> : null}
      {success ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </p>
      ) : null}
      <AdminPaginationBar pagination={pagination} onPageChange={setPage} className="mb-4" />
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
                    loading={pendingAction === "approved"}
                    loadingText="Approving…"
                    disabled={actionLoading}
                    onClick={() =>
                      update(selected.id, "approved").then(() => setSelected(null))
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={pendingAction === "rejected"}
                    loadingText="Rejecting…"
                    disabled={actionLoading}
                    onClick={() =>
                      update(selected.id, "rejected").then(() => setSelected(null))
                    }
                  >
                    Reject
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
