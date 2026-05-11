"use client";

import { useEffect, useState } from "react";
import FacultyShell from "@/components/faculty/FacultyShell";
import { Card, StatusBadge } from "@/components/student/StudentUi";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { authJson } from "@/utils/authClient";

type Assignment = {
  id: string;
  name: string;
  degreeProgram: string;
  email?: string | null;
  semester?: string | null;
  contactNo?: string | null;
  preferredField?: string | null;
  agreementAccepted?: boolean | null;
  companyName?: string | null;
  internshipRole?: string | null;
  facultySupervisorNameDesig?: string | null;
  siteSupervisorNameDesig?: string | null;
  durationWeeks?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  adminApprovalStatus?: string | null;
  facultyVerified?: boolean | null;
  facultyVerifiedAt?: string | null;
  facultyVerificationComments?: string | null;
  studentVerified?: boolean | null;
  studentVerifiedAt?: string | null;
  studentVerificationComments?: string | null;
  calculatedStatus: string;
  student?: { name: string; regNo?: string | null; email: string } | null;
};

export default function FacultyAppexBVerificationPage() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<Assignment[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState<{ id: string; action: "approve" | "request_changes" } | null>(null);

  async function load() {
    const res = await authJson<{ data: Assignment[] }>(`/api/faculty/appex-b-verification?status=${status}`);
    setItems(res.data ?? []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load AppEx B assignments"));
  }, [status]);

  async function action(assignmentId: string, act: "approve" | "request_changes") {
    setPending({ id: assignmentId, action: act });
    try {
      setError("");
      setSuccess("");
      await authJson<{ message: string }>("/api/faculty/appex-b-verification", {
        method: "PATCH",
        body: JSON.stringify({ assignmentId, action: act, comments: comments[assignmentId] || "" }),
      });
      await load();
      setSuccess(act === "approve" ? "AppEx B approved successfully." : "Changes request submitted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process verification");
    } finally {
      setPending(null);
    }
  }

  return (
    <FacultyShell title="AppEx B Verification" description="Approve or request changes on assignment details.">
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="PENDING_VERIFICATION">Pending</option>
          <option value="FACULTY_VERIFIED">Faculty Verified</option>
          <option value="STUDENT_VERIFIED">Student Verified</option>
          <option value="BOTH_VERIFIED">Both Verified</option>
          <option value="CHANGES_REQUESTED">Changes Requested</option>
        </Select>
      </div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {success ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
          {success}
        </p>
      ) : null}
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.student?.name ?? "Unknown"} ({item.student?.regNo ?? "N/A"})
              </h3>
              <StatusBadge status={item.calculatedStatus} />
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {item.name} - {item.degreeProgram}
            </p>

            {/* Show full AppEx B details even before verification */}
            <div className="mt-3 grid gap-1 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              <p>
                <span className="font-semibold">Email:</span> {item.email ?? item.student?.email ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Semester:</span> {item.semester ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Contact No:</span> {item.contactNo ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Preferred Field:</span> {item.preferredField ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Agreement Accepted:</span>{" "}
                {item.agreementAccepted == null ? "N/A" : item.agreementAccepted ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Admin Status:</span> {item.adminApprovalStatus ?? "N/A"}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">Company Name:</span> {item.companyName ?? "N/A"}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">Internship Role:</span> {item.internshipRole ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Faculty Supervisor:</span>{" "}
                {item.facultySupervisorNameDesig ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Site Supervisor:</span> {item.siteSupervisorNameDesig ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold">Duration (Weeks):</span>{" "}
                {item.durationWeeks == null ? "N/A" : String(item.durationWeeks)}
              </p>
              <p>
                <span className="font-semibold">Start Date:</span> {item.startDate ? new Date(item.startDate).toLocaleDateString() : "N/A"}
              </p>
              <p className="sm:col-span-2">
                <span className="font-semibold">End Date:</span>{" "}
                {item.endDate ? new Date(item.endDate).toLocaleDateString() : "N/A"}
              </p>
            </div>

            {(item.studentVerificationComments || item.facultyVerificationComments) ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                <p className="font-semibold">Verification Comments</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="font-semibold">Student</p>
                    <p className="break-words whitespace-pre-wrap">
                      {item.studentVerificationComments?.trim() || "No comments from student."}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Faculty (previous)</p>
                    <p className="break-words whitespace-pre-wrap">
                      {item.facultyVerificationComments?.trim() || "No previous faculty comments."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <Textarea
              className="mt-2 min-h-20"
              placeholder="Optional verification comments"
              value={comments[item.id] || ""}
              onChange={(e) => setComments((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => action(item.id, "approve")}
                loading={pending?.id === item.id && pending.action === "approve"}
                loadingText="Approving…"
                disabled={pending !== null}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => action(item.id, "request_changes")}
                loading={pending?.id === item.id && pending.action === "request_changes"}
                loadingText="Submitting…"
                disabled={pending !== null}
              >
                Request Changes
              </Button>
            </div>
          </Card>
        ))}
        {items.length === 0 ? <p className="text-sm text-slate-600">No assignments found.</p> : null}
      </div>
    </FacultyShell>
  );
}
