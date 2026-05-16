"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authFetch, authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AdminPagination } from "@/utils/adminPagination";
import { AdminPaginationBar } from "@/components/admin/AdminPaginationBar";
import { AdminRegNoSearch } from "@/components/admin/AdminRegNoSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Internship = {
  id: string;
  type: string;
  status: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
  faculty?: { name: string } | null;
  site?: { name: string; company?: { name: string } | null } | null;
};

const PAGE_SIZE = 20;

export default function AdminInternshipsPage() {
  const [items, setItems] = useState<Internship[]>([]);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [batchPrefix, setBatchPrefix] = useState("");
  const [exportFinalizedOnly, setExportFinalizedOnly] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [regNoInput, setRegNoInput] = useState("");
  const debouncedRegNo = useDebouncedValue(regNoInput, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedRegNo]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const regQs = debouncedRegNo.trim()
      ? `&regNo=${encodeURIComponent(debouncedRegNo.trim())}`
      : "";
    authJson<{ data: Internship[]; pagination?: AdminPagination }>(
      `/api/admin/internships?page=${page}&pageSize=${PAGE_SIZE}${regQs}`,
    )
      .then((res) => {
        setItems(res.data ?? []);
        setPagination(res.pagination ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load internships"))
      .finally(() => setLoading(false));
  }, [page, debouncedRegNo]);

  async function downloadBatchResultsCsv() {
    const trimmed = batchPrefix.trim();
    if (!trimmed) {
      setExportMessage("Enter a registration batch prefix (e.g. AB24-CSE-).");
      return;
    }
    setExporting(true);
    setExportMessage("");
    try {
      const params = new URLSearchParams({
        prefix: trimmed,
        finalizedOnly: exportFinalizedOnly ? "true" : "false",
      });
      const res = await authFetch(`/api/admin/export-final-results?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "text/csv" },
      });
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const fallbackName = `final-results-${trimmed.replace(/[^\w-]+/g, "_")}.csv`;
      const filename = match?.[1] ?? fallbackName;

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          typeof errBody === "object" && errBody && "error" in errBody
            ? String((errBody as { error?: string }).error)
            : "Export failed",
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMessage("Download started.");
    } catch (e) {
      setExportMessage(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminShell title="Internships" description="View all internship records across the system.">
      {error ? <PageError message={error} className="mb-3" /> : null}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Export result sheet (CSV)</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Students in the same batch share a registration prefix (format{" "}
          <span className="font-mono">AA00-BBB-000</span>; e.g. AB24-CSE-001, AB24-CSE-002 → use{" "}
          <span className="font-mono">AB24-CSE-</span>). Opens in Excel for printing or saving as PDF.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="batch-prefix" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Batch prefix
            </label>
            <input
              id="batch-prefix"
              className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 font-mono text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b2e83]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="AB24-CSE-"
              value={batchPrefix}
              onChange={(e) => setBatchPrefix(e.target.value)}
              autoComplete="off"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300 sm:pb-2.5">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-[#4b2e83]"
              checked={exportFinalizedOnly}
              onChange={(e) => setExportFinalizedOnly(e.target.checked)}
            />
            Faculty-finalized only
          </label>
          <Button type="button" onClick={downloadBatchResultsCsv} disabled={exporting}>
            {exporting ? "Preparing…" : "Download CSV"}
          </Button>
        </div>
        {exportMessage ? (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400" role="status">
            {exportMessage}
          </p>
        ) : null}
      </Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <AdminRegNoSearch id="admin-internships-reg-no" value={regNoInput} onChange={setRegNoInput} />
      </div>
      <AdminPaginationBar pagination={pagination} onPageChange={setPage} className="mb-4" />
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
