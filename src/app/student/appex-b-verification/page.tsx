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

function InlineSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function AppexBVerificationPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<"approve" | "request_changes" | null>(null);

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
    setPendingAction(action);
    try {
      const res = await authJson<{ message: string }>("/api/student/appex-b-verification", {
        method: "PATCH",
        body: JSON.stringify({ action, comments }),
      });
      setMessage(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit verification");
    } finally {
      setPendingAction(null);
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
              disabled={pendingAction !== null}
              className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => submit("approve")}
                disabled={pendingAction !== null}
                aria-busy={pendingAction === "approve" || undefined}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "approve" ? (
                  <>
                    <InlineSpinner />
                    Approving…
                  </>
                ) : (
                  "Approve"
                )}
              </button>
              <button
                type="button"
                onClick={() => submit("request_changes")}
                disabled={pendingAction !== null}
                aria-busy={pendingAction === "request_changes" || undefined}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "request_changes" ? (
                  <>
                    <InlineSpinner />
                    Submitting…
                  </>
                ) : (
                  "Request Changes"
                )}
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
