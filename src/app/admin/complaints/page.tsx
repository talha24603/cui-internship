"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";
import { PageEmpty, PageError } from "@/components/shared/page-state";

type Complaint = {
  id: string;
  subject: string;
  body: string;
  status: string;
  resolutionNotes?: string | null;
  submittedBy?: { name: string; regNo?: string | null } | null;
};

export default function AdminComplaintsPage() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<Complaint[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: string; status: string } | null>(null);

  async function load() {
    const query = status === "all" ? "" : `?status=${status}`;
    const res = await authJson<{ complaints: Complaint[] }>(`/api/admin/complaints${query}`);
    setItems(res.complaints ?? []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load complaints"));
  }, [status]);

  async function updateComplaint(id: string, nextStatus: string) {
    setPendingAction({ id, status: nextStatus });
    try {
      await authJson<{ message: string }>(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, resolutionNotes: notes[id] || "" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update complaint");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <AdminShell title="Complaints" description="Resolve and track complaints across the platform.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_REVIEW">IN_REVIEW</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="DISMISSED">DISMISSED</option>
        </Select>
      </div>
      {error ? <PageError message={error} className="mb-3" /> : null}
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.subject} - {item.submittedBy?.name ?? "Unknown"} ({item.submittedBy?.regNo ?? "N/A"})
              </h3>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{item.body}</p>
            <Textarea
              className="mt-2 min-h-20"
              placeholder="Resolution notes"
              value={notes[item.id] ?? item.resolutionNotes ?? ""}
              onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => updateComplaint(item.id, "IN_REVIEW")}
                loading={pendingAction?.id === item.id && pendingAction.status === "IN_REVIEW"}
                loadingText="Updating…"
                disabled={pendingAction !== null}
              >
                In Review
              </Button>
              <Button
                size="sm"
                onClick={() => updateComplaint(item.id, "RESOLVED")}
                loading={pendingAction?.id === item.id && pendingAction.status === "RESOLVED"}
                loadingText="Resolving…"
                disabled={pendingAction !== null}
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateComplaint(item.id, "DISMISSED")}
                loading={pendingAction?.id === item.id && pendingAction.status === "DISMISSED"}
                loadingText="Dismissing…"
                disabled={pendingAction !== null}
              >
                Dismiss
              </Button>
            </div>
          </Card>
        ))}
        {items.length === 0 ? <PageEmpty message="No complaints found." /> : null}
      </div>
    </AdminShell>
  );
}
