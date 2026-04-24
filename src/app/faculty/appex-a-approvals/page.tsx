"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { authJson } from "@/utils/authClient";

type AppexA = {
  id: string;
  status: string;
  organization: string;
  internshipLocation: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
};

export default function FacultyAppexAApprovalsPage() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<AppexA[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    const res = await authJson<{ data: AppexA[] }>(`/api/faculty/appex-a-approval?status=${status}`);
    setItems(res.data ?? []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load AppEx A submissions"));
  }, [status]);

  async function takeAction(appexAId: string, nextStatus: "approved" | "rejected") {
    setError("");
    try {
      await authJson<{ message: string }>("/api/faculty/appex-a-approval", {
        method: "PATCH",
        body: JSON.stringify({ appexAId, status: nextStatus, comments: comments[appexAId] || "" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    }
  }

  return (
    <FacultyShell title="AppEx A Approvals" description="Review and process AppEx A submissions.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </Select>
      </div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      <div className="space-y-4">
        {items.map((item) => (
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
              value={comments[item.id] || ""}
              onChange={(e) => setComments((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
            {item.status === "pending" ? (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => takeAction(item.id, "approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => takeAction(item.id, "rejected")}>
                  Reject
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
        {items.length === 0 ? <p className="text-sm text-slate-600">No submissions found.</p> : null}
      </div>
    </FacultyShell>
  );
}
