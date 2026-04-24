"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

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

export default function AdminCompanyRequestsPage() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState<CompanyRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    const query = status ? `?status=${status}` : "";
    const res = await authJson<{ requests: CompanyRequest[] }>(`/api/admin/review-company${query}`);
    setItems(res.requests ?? []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load company requests"));
  }, [status]);

  async function review(requestId: string, action: "APPROVE" | "REJECT") {
    setError("");
    try {
      await authJson<{ message: string }>("/api/admin/review-company", {
        method: "POST",
        body: JSON.stringify({ requestId, action, notes: notes[requestId] || "" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review request");
    }
  }

  return (
    <AdminShell title="Company Requests" description="Approve or reject new company onboarding requests.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </Select>
      </div>
      {error ? <PageError message={error} className="mb-3" /> : null}
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
                <Button size="sm" onClick={() => review(item.id, "APPROVE")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => review(item.id, "REJECT")}>Reject</Button>
              </div>
            ) : null}
          </Card>
        ))}
        {items.length === 0 ? <PageEmpty message="No company requests found." /> : null}
      </div>
    </AdminShell>
  );
}
