"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";
import type { AdminPagination } from "@/utils/adminPagination";
import { AdminPaginationBar } from "@/components/admin/AdminPaginationBar";

type CompanyRequest = {
  id: string;
  name: string;
  email: string;
  industry?: string | null;
  reason?: string | null;
  status: string;
  notes?: string | null;
  requestedBy?: { name: string; regNo?: string | null } | null;
};

const PAGE_LIMIT = 10;

export default function AdminCompanyRequestsPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [items, setItems] = useState<CompanyRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: string; action: "APPROVE" | "REJECT" } | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(PAGE_LIMIT));
    const res = await authJson<{
      requests: CompanyRequest[];
      pagination?: { page: number; limit: number; total: number; pages: number };
    }>(`/api/admin/review-company?${params.toString()}`);
    setItems(res.requests ?? []);
    const p = res.pagination;
    setPagination(
      p
        ? { page: p.page, pageSize: p.limit, total: p.total, totalPages: p.pages }
        : null,
    );
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load company requests"));
  }, [status, page]);

  async function review(requestId: string, action: "APPROVE" | "REJECT") {
    setError("");
    setPendingAction({ id: requestId, action });
    try {
      await authJson<{ message: string }>("/api/admin/review-company", {
        method: "POST",
        body: JSON.stringify({ requestId, action, notes: notes[requestId] || "" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review request");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <AdminShell title="Company Requests" description="Approve or reject new company onboarding requests.">
      <div className="mb-4 max-w-xs">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </Select>
      </div>
      {error ? <PageError message={error} className="mb-3" /> : null}
      <AdminPaginationBar pagination={pagination} onPageChange={setPage} className="mb-4" />
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.name} ({item.industry || "N/A"})
              </h3>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.email}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Requested by: {item.requestedBy?.name ?? "Unknown"} ({item.requestedBy?.regNo ?? "N/A"})
            </p>
            {item.reason ? <p className="text-xs text-slate-600 dark:text-slate-400">Reason: {item.reason}</p> : null}
            <Textarea
              className="mt-2 min-h-20"
              placeholder="Optional review notes"
              value={notes[item.id] ?? item.notes ?? ""}
              onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
            {item.status === "PENDING" ? (
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => review(item.id, "APPROVE")}
                  loading={pendingAction?.id === item.id && pendingAction.action === "APPROVE"}
                  loadingText="Approving…"
                  disabled={pendingAction !== null}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review(item.id, "REJECT")}
                  loading={pendingAction?.id === item.id && pendingAction.action === "REJECT"}
                  loadingText="Rejecting…"
                  disabled={pendingAction !== null}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
        {items.length === 0 ? <PageEmpty message="No company requests found." /> : null}
      </div>
    </AdminShell>
  );
}
