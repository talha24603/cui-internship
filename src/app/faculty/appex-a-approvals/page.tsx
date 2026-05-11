"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authJson } from "@/utils/authClient";

type AppexA = {
  id: string;
  status: string;
  organization: string;
  internshipLocation: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
};

export default function FacultyAppexAApprovalsPage() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState<AppexA[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = status === "all" ? "all" : status.toLowerCase();
      const res = await authJson<{ data: AppexA[] }>(`/api/faculty/appex-a-approval?status=${qs}`);
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

  async function takeAction(appexAId: string, nextStatus: "approved" | "rejected") {
    setError("");
    setSuccess("");
    setPending({ id: appexAId, action: nextStatus });
    try {
      const res = await authJson<{ message: string }>("/api/faculty/appex-a-approval", {
        method: "PATCH",
        body: JSON.stringify({ appexAId, status: nextStatus, comments: comments[appexAId] || "" }),
      });
      setSuccess(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    } finally {
      setPending(null);
    }
  }

  return (
    <FacultyShell title="AppEx A Approvals" description="Review and process AppEx A submissions.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="all">All</option>
        </Select>
      </div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {success ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </p>
      ) : null}
      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </>
        ) : (
          <>
            {items.map((item) => {
              const busy = pending?.id === item.id;
              const anyPending = pending !== null;
              return (
                <Card key={item.id}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
                    </h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {item.organization} - {item.internshipLocation}
                  </p>
                  <Textarea
                    className="mt-2 min-h-20"
                    placeholder="Optional comments"
                    disabled={busy}
                    value={comments[item.id] || ""}
                    onChange={(e) => setComments((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  {item.status === "PENDING" ? (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => takeAction(item.id, "approved")}
                        loading={busy && pending?.action === "approved"}
                        loadingText="Approving…"
                        disabled={anyPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => takeAction(item.id, "rejected")}
                        loading={busy && pending?.action === "rejected"}
                        loadingText="Rejecting…"
                        disabled={anyPending}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </Card>
              );
            })}
            {items.length === 0 ? <p className="text-sm text-slate-600">No submissions found.</p> : null}
          </>
        )}
      </div>
    </FacultyShell>
  );
}
