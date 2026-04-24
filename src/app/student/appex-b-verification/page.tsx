"use client";

import { useEffect, useState } from "react";
import StudentShell from "@/components/student/StudentShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { authJson } from "@/utils/authClient";

type Assignment = {
  id: string;
  name: string;
  degreeProgram: string;
  status: string;
  faculty?: { name: string } | null;
  site?: { name: string } | null;
  studentVerificationComments?: string | null;
};

export default function AppexBVerificationPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await authJson<{ data: Assignment }>("/api/student/appex-b-verification");
    setAssignment(res.data);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load verification"));
  }, []);

  async function submit(action: "approve" | "request_changes") {
    setMessage("");
    setError("");
    try {
      const res = await authJson<{ message: string }>("/api/student/appex-b-verification", {
        method: "PATCH",
        body: JSON.stringify({ action, comments }),
      });
      setMessage(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit verification");
    }
  }

  return (
    <StudentShell title="AppEx B Verification" description="Approve assignment or request changes.">
      <Card>
        {!assignment ? (
          <p className="text-sm text-slate-600">No assignment found yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">{assignment.name}</h2>
              <StatusBadge status={assignment.status} />
            </div>
            <p className="text-sm text-slate-700">
              Program: {assignment.degreeProgram} | Faculty: {assignment.faculty?.name ?? "N/A"} | Site:{" "}
              {assignment.site?.name ?? "N/A"}
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add optional comments"
              className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => submit("approve")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                onClick={() => submit("request_changes")}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Request Changes
              </button>
            </div>
          </div>
        )}
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
    </StudentShell>
  );
}
